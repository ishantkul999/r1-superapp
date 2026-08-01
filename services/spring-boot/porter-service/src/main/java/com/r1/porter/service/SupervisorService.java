package com.r1.porter.service;

import com.r1.porter.dto.SupervisorDashboardDto;
import com.r1.porter.entity.Porter;
import com.r1.porter.entity.PorterBooking;
import com.r1.porter.repository.PorterBookingRepository;
import com.r1.porter.repository.PorterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SupervisorService {

    private final PorterRepository porterRepository;
    private final PorterBookingRepository bookingRepository;

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    public SupervisorDashboardDto getDashboard() {
        Instant startOfToday = LocalDate.now().atStartOfDay(IST).toInstant();

        long active = porterRepository.countByIsActiveTrue();
        long online = porterRepository.countByIsActiveTrueAndIsOnlineTrue();
        long unassigned  = bookingRepository.findUnassignedPendingBookings().size();
        long todayAll    = bookingRepository.countAllCompletedSince(startOfToday)
                + bookingRepository.findPendingBookings().size();
        long completed   = bookingRepository.countAllCompletedSince(startOfToday);
        long pendingCod  = bookingRepository.findPendingBookings().stream()
                .filter(b -> "COD".equals(b.getPaymentMethod()))
                .count();

        return SupervisorDashboardDto.builder()
                .activePorters(active)
                .onlinePorters(online)
                .unassigned(unassigned)
                .todayBookings(todayAll)
                .completed(completed)
                .pendingCod(pendingCod)
                .build();
    }


    public List<Porter> getAvailablePorters() {
        List<Porter> offline = porterRepository.findByIsOnlineFalseAndIsActiveTrue();

        // Filter out porters who already have an ACCEPTED or IN_PROGRESS booking
        return offline.stream()
                .filter(p -> bookingRepository.findActiveBookingsByPorter(p.getId()).isEmpty())
                .collect(Collectors.toList());
    }

    @Transactional
    public PorterBooking supervisorAssign(UUID bookingId, UUID porterId) {
        PorterBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        if (!"PENDING_ACCEPTANCE".equals(booking.getStatus())) {
            throw new RuntimeException(
                    "Cannot assign: booking status is " + booking.getStatus()
            );
        }

        List<PorterBooking> activeJobs = bookingRepository.findActiveBookingsByPorter(porterId);
        if (!activeJobs.isEmpty()) {
            throw new RuntimeException("Porter " + porterId + " already has an active job");
        }

        booking.setPorterId(porterId);
        booking.setStatus("ACCEPTED");
        booking.setAcceptanceTime(Instant.now());
        booking = bookingRepository.save(booking);

        log.info("Supervisor manually assigned booking {} to porter {}", bookingId, porterId);
        return booking;
    }
}

