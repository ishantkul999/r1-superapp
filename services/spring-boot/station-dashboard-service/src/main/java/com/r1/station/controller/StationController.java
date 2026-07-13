package com.r1.station.controller;

import com.r1.station.entity.*;
import com.r1.station.service.StationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/station")
@RequiredArgsConstructor
public class StationController {

    private final StationService stationService;

    // ─── Facilities ──────────────────────────────────────────────────
    @GetMapping("/facilities")
    public ResponseEntity<List<Facility>> getFacilities() {
        return ResponseEntity.ok(stationService.getAllFacilities());
    }

    @PutMapping("/facilities/{facilityId}/status")
    public ResponseEntity<Facility> updateFacilityStatus(
            @PathVariable UUID facilityId,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String role,
            @RequestBody Map<String, Object> body) {
        if (!List.of("SUPERVISOR", "STATION_CONTROL_ROOM", "SUPERADMIN").contains(role)) {
            return ResponseEntity.status(403).build();
        }
        Facility updated = stationService.updateFacilityStatus(
                facilityId,
                (String) body.get("status"),
                (String) body.get("reason"),
                body.get("estimatedMins") != null ? ((Number) body.get("estimatedMins")).intValue() : null,
                UUID.fromString(userId)
        );
        return ResponseEntity.ok(updated);
    }

    // ─── Station Rooms ───────────────────────────────────────────────
    @GetMapping("/rooms")
    public ResponseEntity<List<StationRoom>> getRooms(
            @RequestParam(required = false) String roomType) {
        return ResponseEntity.ok(stationService.getAvailableRooms(roomType));
    }

    @PostMapping("/rooms/book")
    public ResponseEntity<RoomBooking> bookRoom(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(stationService.bookRoom(UUID.fromString(userId), body));
    }

    @PostMapping("/rooms/bookings/{bookingId}/cancel")
    public ResponseEntity<RoomBooking> cancelRoomBooking(
            @PathVariable UUID bookingId,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(stationService.cancelRoomBooking(bookingId, UUID.fromString(userId)));
    }

    @GetMapping("/rooms/bookings/my")
    public ResponseEntity<List<RoomBooking>> myRoomBookings(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(stationService.getUserRoomBookings(UUID.fromString(userId)));
    }

    // ─── Digital Lockers ────────────────────────────────────────────
    @GetMapping("/lockers")
    public ResponseEntity<List<DigitalLocker>> getLockers(
            @RequestParam(required = false) String size) {
        return ResponseEntity.ok(stationService.getAvailableLockers(size));
    }

    @PostMapping("/lockers/book")
    public ResponseEntity<LockerBooking> bookLocker(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(stationService.bookLocker(UUID.fromString(userId), body));
    }

    @GetMapping("/lockers/bookings/my")
    public ResponseEntity<List<LockerBooking>> myLockerBookings(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(stationService.getUserLockerBookings(UUID.fromString(userId)));
    }
}
