package com.r1.porter.controller;

import com.r1.porter.dto.EarningsDto;
import com.r1.porter.dto.PorterBookingDetailDto;
import com.r1.porter.dto.PorterDashboardDto;
import com.r1.porter.dto.SupervisorDashboardDto;
import com.r1.porter.entity.Porter;
import com.r1.porter.entity.PorterBooking;
import com.r1.porter.entity.PorterRating;
import com.r1.porter.service.PorterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/porter")
@RequiredArgsConstructor
public class PorterController {

    private final PorterService porterService;

    private static final List<String> STAFF_ROLES =
            List.of("SUPERVISOR", "STATION_CONTROL_ROOM", "SUPERADMIN");


    @PostMapping("/bookings")
    public ResponseEntity<PorterBooking> createBooking(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(porterService.createBooking(UUID.fromString(userId), request));
    }

    @GetMapping("/bookings/my")
    public ResponseEntity<List<PorterBookingDetailDto>> myBookings(
            @RequestHeader("X-User-Id") String userId) {
        List<PorterBookingDetailDto> bookings =
                porterService.getBookingsForUserWithPorterDetails(UUID.fromString(userId));
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/bookings/porter")
    public ResponseEntity<List<PorterBooking>> porterBookings(
            @RequestHeader("X-User-Id")   String userId,
            @RequestHeader("X-User-Role") String role) {
        if (!List.of("PORTER", "SUPERVISOR", "STATION_CONTROL_ROOM", "SUPERADMIN").contains(role))
            return ResponseEntity.status(403).build();
        try {
            Porter porter = porterService.getPorterByUserId(UUID.fromString(userId));
            return ResponseEntity.ok(porterService.getBookingsByPorter(porter.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).build();
        }
    }

    @GetMapping("/bookings/pending")
    public ResponseEntity<List<PorterBooking>> pendingBookings(
            @RequestHeader("X-User-Role") String role) {
        if (!List.of("PORTER", "SUPERVISOR", "STATION_CONTROL_ROOM", "SUPERADMIN").contains(role))
            return ResponseEntity.status(403).build();
        return ResponseEntity.ok(porterService.getPendingBookings());
    }

    @PostMapping("/bookings/{bookingId}/accept")
    public ResponseEntity<?> acceptBooking(
            @PathVariable UUID bookingId,
            @RequestHeader("X-User-Id")   String userId,
            @RequestHeader("X-User-Role") String role) {
        if (!"PORTER".equals(role)) return ResponseEntity.status(403).build();
        Porter porter;
        try {
            porter = porterService.getPorterByUserId(UUID.fromString(userId));
        } catch (RuntimeException e) {
            log.warn("Accept booking {}: no porter profile for userId={}", bookingId, userId);
            return ResponseEntity.status(404).body(Map.of(
                    "error", "Porter profile not found. Contact your supervisor.",
                    "code", "PORTER_NOT_REGISTERED"));
        }
        try {
            return ResponseEntity.ok(porterService.acceptBooking(bookingId, porter.getId()));
        } catch (RuntimeException e) {
            log.warn("Accept booking {} failed for porter {}: {}", bookingId, porter.getId(), e.getMessage());
            // Distinguish "already gone" (someone else took it / it was cancelled)
            // from genuine 404s so the porter app can show an accurate message.
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/bookings/{bookingId}/start")
    public ResponseEntity<PorterBooking> startService(
            @PathVariable UUID bookingId,
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Map<String, String> body) {
        try {
            Porter porter = porterService.getPorterByUserId(UUID.fromString(userId));
            return ResponseEntity.ok(porterService.startService(bookingId, porter.getId(), body.get("pin")));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).build();
        }
    }

    @PostMapping("/bookings/{bookingId}/complete")
    public ResponseEntity<PorterBooking> completeService(
            @PathVariable UUID bookingId,
            @RequestHeader("X-User-Id") String userId) {
        try {
            Porter porter = porterService.getPorterByUserId(UUID.fromString(userId));
            return ResponseEntity.ok(porterService.completeService(bookingId, porter.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).build();
        }
    }

    @PostMapping("/bookings/{bookingId}/cancel")
    public ResponseEntity<PorterBooking> cancelBooking(
            @PathVariable UUID bookingId,
            @RequestHeader("X-User-Id")   String userId,
            @RequestHeader("X-User-Role") String role) {
        return ResponseEntity.ok(porterService.cancelBooking(bookingId, UUID.fromString(userId), role));
    }

    @PostMapping("/bookings/{bookingId}/rate")
    public ResponseEntity<PorterRating> rateBooking(
            @PathVariable UUID bookingId,
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Map<String, Object> body) {
        int    rating  = ((Number) body.get("rating")).intValue();
        String comment = (String) body.get("comment");
        return ResponseEntity.ok(porterService.rateBooking(bookingId, UUID.fromString(userId), rating, comment));
    }

    @PostMapping("/register")
    public ResponseEntity<Porter> registerPorter(
            @RequestHeader("X-User-Role") String role,
            @RequestBody Map<String, Object> request) {
        if (!STAFF_ROLES.contains(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(porterService.registerPorter(request));
    }

    @GetMapping("/online")
    public ResponseEntity<List<Porter>> onlinePorters(
            @RequestHeader("X-User-Role") String role) {
        if (!STAFF_ROLES.contains(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(porterService.getOnlinePorters());
    }
    @GetMapping("/dashboard")
    public ResponseEntity<?> porterDashboard(
            @RequestHeader("X-User-Id")   String userId,
            @RequestHeader("X-User-Role") String role) {
        if (!"PORTER".equals(role)) return ResponseEntity.status(403).build();
        try {
            porterService.setOnlineByUserId(UUID.fromString(userId), true);
            PorterDashboardDto dto = porterService.getDashboard(UUID.fromString(userId));
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            log.warn("Porter dashboard: no profile for userId={}", userId);
            return ResponseEntity.status(404).body(Map.of(
                    "error", "Porter profile not found. Contact your supervisor.",
                    "code",  "PORTER_NOT_REGISTERED"
            ));
        }
    }


    @GetMapping("/directory")
    public ResponseEntity<List<Porter>> porterDirectory(
            @RequestHeader("X-User-Role") String role) {
        if (!STAFF_ROLES.contains(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(porterService.getAllPorters());
    }


    @GetMapping("/requests/pending")
    public ResponseEntity<List<PorterBooking>> pendingRequests(
            @RequestHeader("X-User-Role") String role) {
        if (!"PORTER".equals(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(porterService.getPendingBookings());
    }

    @GetMapping("/active-job")
    public ResponseEntity<?> activeJob(
            @RequestHeader("X-User-Id")   String userId,
            @RequestHeader("X-User-Role") String role) {
        if (!"PORTER".equals(role)) return ResponseEntity.status(403).build();
        try {
            Optional<PorterBooking> job = porterService.getActiveJob(UUID.fromString(userId));
            return job.map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.noContent().build());
        } catch (RuntimeException e) {
            log.warn("Active job: no porter profile for userId={}", userId);
            return ResponseEntity.status(404)
                    .body(Map.of("error", "Porter profile not found",
                            "code",  "PORTER_NOT_REGISTERED"));
        }
    }

    @GetMapping("/earnings")
    public ResponseEntity<?> earnings(
            @RequestHeader("X-User-Id")   String userId,
            @RequestHeader("X-User-Role") String role,
            @RequestParam(defaultValue = "WEEK") String period) {
        if (!"PORTER".equals(role)) return ResponseEntity.status(403).build();
        try {
            EarningsDto dto = porterService.getEarnings(UUID.fromString(userId), period);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            log.warn("Earnings: no porter profile for userId={}", userId);
            return ResponseEntity.status(404)
                    .body(Map.of("error", "Porter profile not found",
                            "code",  "PORTER_NOT_REGISTERED"));
        }
    }


}
