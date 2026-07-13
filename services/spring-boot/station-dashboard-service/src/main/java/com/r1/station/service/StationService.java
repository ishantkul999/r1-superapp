package com.r1.station.service;

import com.r1.station.entity.*;
import com.r1.station.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.temporal.ChronoUnit;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.*;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class StationService {

    private final FacilityRepo facilityRepo;
    private final StationRoomRepo roomRepo;
    private final DigitalLockerRepo lockerRepo;
    private final RoomBookingRepo roomBookingRepo;
    private final LockerBookingRepo lockerBookingRepo;
    private final CrisApiClient crisApiClient;
    private final QrCodeGenerator qrCodeGenerator;
    private final StringRedisTemplate redisTemplate;

    private static final UUID DEFAULT_STATION_ID = UUID.fromString("00000000-0000-0000-0000-100000000001");

    // ─── Facilities ──────────────────────────────────────────────────

    public List<Facility> getAllFacilities() {
        return facilityRepo.findByStationId(DEFAULT_STATION_ID);
    }

    @Transactional
    public Facility updateFacilityStatus(UUID facilityId, String status,
                                          String reason, Integer estimatedMins, UUID updatedBy) {
        Facility facility = facilityRepo.findById(facilityId)
                .orElseThrow(() -> new RuntimeException("Facility not found"));
        facility.setStatus(status);
        facility.setReason(reason);
        facility.setEstimatedResolutionMins(estimatedMins);
        facility.setUpdatedBy(updatedBy);
        facility.setUpdatedAt(Instant.now());
        facility = facilityRepo.save(facility);

        // Publish status change to Redis pub/sub for live dashboard
        redisTemplate.convertAndSend("facility:status_updates",
                facilityId + ":" + status);

        return facility;
    }

    // ─── Station Rooms ───────────────────────────────────────────────

    public List<StationRoom> getAvailableRooms(String roomType) {
        if (roomType != null && !roomType.isBlank()) {
            return roomRepo.findByStationIdAndRoomTypeAndIsActiveTrue(DEFAULT_STATION_ID, roomType);
        }
        return roomRepo.findByStationIdAndIsActiveTrue(DEFAULT_STATION_ID);
    }

    @Transactional
    public RoomBooking bookRoom(UUID userId, Map<String, Object> request) {
        UUID roomId = UUID.fromString((String) request.get("roomId"));
        LocalDate checkIn = LocalDate.parse((String) request.get("checkIn"));
        LocalDate checkOut = LocalDate.parse((String) request.get("checkOut"));
        int bedsBooked = ((Number) request.getOrDefault("bedsBooked", 1)).intValue();

        StationRoom room = roomRepo.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        // Check availability
        List<RoomBooking> conflicts = roomBookingRepo.findConflictingBookings(roomId, checkIn, checkOut);
        if (!conflicts.isEmpty()) {
            throw new RuntimeException("Room not available for selected dates");
        }

        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        if (nights <= 0) throw new RuntimeException("Check-out must be after check-in");

        BigDecimal total = room.getPricePerNight()
                .multiply(BigDecimal.valueOf(nights))
                .multiply(BigDecimal.valueOf(bedsBooked));

        // Call CRIS API
        Map<String, Object> crisResponse = crisApiClient.bookRoom(
                room.getCrisRoomId(), checkIn.toString(), checkOut.toString(),
                bedsBooked, userId.toString());

        String bookingRef = "RB" + System.currentTimeMillis() % 100000000L;
        String qrContent = qrCodeGenerator.generateBookingQrContent(bookingRef, "ROOM");
        String qrCode = qrCodeGenerator.generateBase64QrCode(qrContent);

        RoomBooking booking = RoomBooking.builder()
                .bookingReference(bookingRef)
                .crisBookingRef((String) crisResponse.get("crisBookingRef"))
                .roomId(roomId)
                .userId(userId)
                .checkIn(checkIn)
                .checkOut(checkOut)
                .bedsBooked(bedsBooked)
                .totalAmount(total)
                .status("PENDING")
                .qrCode(qrCode)
                .specialRequests((String) request.get("specialRequests"))
                .build();

        return roomBookingRepo.save(booking);
    }

    @Transactional
    public RoomBooking confirmRoomBooking(UUID bookingId, UUID paymentId) {
        RoomBooking booking = roomBookingRepo.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Room booking not found"));
        booking.setPaymentId(paymentId);
        booking.setStatus("CONFIRMED");
        return roomBookingRepo.save(booking);
    }

    @Transactional
    public RoomBooking cancelRoomBooking(UUID bookingId, UUID userId) {
        RoomBooking booking = roomBookingRepo.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Room booking not found"));

        if (!booking.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        if ("CHECKED_IN".equals(booking.getStatus())) {
            throw new RuntimeException("Cannot cancel an active check-in");
        }

        // CRIS cancellation
        if (booking.getCrisBookingRef() != null) {
            crisApiClient.cancelRoom(booking.getCrisBookingRef());
        }

        booking.setStatus("CANCELLED");
        return roomBookingRepo.save(booking);
    }

    // ─── Digital Lockers ────────────────────────────────────────────

    public List<DigitalLocker> getAvailableLockers(String size) {
        if (size != null && !size.isBlank()) {
            return lockerRepo.findByStationIdAndSizeAndIsActiveTrue(DEFAULT_STATION_ID, size);
        }
        return lockerRepo.findByStationIdAndIsActiveTrue(DEFAULT_STATION_ID);
    }

    @Transactional
    public LockerBooking bookLocker(UUID userId, Map<String, Object> request) {
        UUID lockerId = UUID.fromString((String) request.get("lockerId"));
        String durationType = (String) request.get("durationType"); // "6HR" or "DAY"

        DigitalLocker locker = lockerRepo.findById(lockerId)
                .orElseThrow(() -> new RuntimeException("Locker not found"));

        Instant startTime = Instant.now();
        Instant endTime = "DAY".equals(durationType)
                ? startTime.plus(Duration.ofHours(24))
                : startTime.plus(Duration.ofHours(6));

        // Conflict check
        List<LockerBooking> conflicts = lockerBookingRepo.findConflictingLockerBookings(lockerId, startTime, endTime);
        if (!conflicts.isEmpty()) {
            throw new RuntimeException("Locker not available for selected duration");
        }

        BigDecimal price = "DAY".equals(durationType) ? locker.getPricePerDay() : locker.getPricePer6hr();

        // Call CRIS API
        Map<String, Object> crisResponse = crisApiClient.bookLocker(
                locker.getCrisLockerId(), startTime.toString(), endTime.toString(), userId.toString());

        String bookingRef = "LB" + System.currentTimeMillis() % 100000000L;
        String accessPin = (String) crisResponse.getOrDefault("accessPin",
                String.format("%04d", new SecureRandom().nextInt(10000)));
        String qrContent = qrCodeGenerator.generateBookingQrContent(bookingRef, "LOCKER");
        String qrCode = qrCodeGenerator.generateBase64QrCode(qrContent);

        LockerBooking booking = LockerBooking.builder()
                .bookingReference(bookingRef)
                .crisBookingRef((String) crisResponse.get("crisBookingRef"))
                .lockerId(lockerId)
                .userId(userId)
                .startTime(startTime)
                .endTime(endTime)
                .durationType(durationType)
                .totalAmount(price)
                .status("PENDING")
                .accessPin(accessPin)
                .qrCode(qrCode)
                .build();

        return lockerBookingRepo.save(booking);
    }

    @Transactional
    public LockerBooking confirmLockerBooking(UUID bookingId, UUID paymentId) {
        LockerBooking booking = lockerBookingRepo.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Locker booking not found"));
        booking.setPaymentId(paymentId);
        booking.setStatus("CONFIRMED");
        return lockerBookingRepo.save(booking);
    }

    public List<RoomBooking> getUserRoomBookings(UUID userId) {
        return roomBookingRepo.findByUserId(userId);
    }

    public List<LockerBooking> getUserLockerBookings(UUID userId) {
        return lockerBookingRepo.findByUserId(userId);
    }
}
