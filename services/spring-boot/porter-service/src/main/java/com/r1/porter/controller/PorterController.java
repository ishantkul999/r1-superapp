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

/**
 * REPLACE the existing PorterController.java entirely.
 *
 * DROP AT:
 *   services/spring-boot/porter-service/src/main/java/com/r1/porter/controller/PorterController.java
 *
 * Key fix in this version:
 *   getDashboard / getActiveJob / getEarnings now catch RuntimeException from
 *   getPorterByUserId() and return 404 instead of letting the exception
 *   propagate as a 500. This happens when a user has role=PORTER in their JWT
 *   but hasn't been registered via POST /api/porter/register yet.
 */
@Slf4j
@RestController
@RequestMapping("/api/porter")
@RequiredArgsConstructor
public class PorterController {

    private final PorterService porterService;

    private static final List<String> STAFF_ROLES =
            List.of("SUPERVISOR", "STATION_CONTROL_ROOM", "SUPERADMIN");

    // ─── ORIGINAL ENDPOINTS (unchanged) ──────────────────────────────────────

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
    public ResponseEntity<PorterBooking> acceptBooking(
            @PathVariable UUID bookingId,
            @RequestHeader("X-User-Id")   String userId,
            @RequestHeader("X-User-Role") String role) {
        if (!"PORTER".equals(role)) return ResponseEntity.status(403).build();
        try {
            Porter porter = porterService.getPorterByUserId(UUID.fromString(userId));
            return ResponseEntity.ok(porterService.acceptBooking(bookingId, porter.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(null);
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

    // ─── NEW ENDPOINT 1: Porter Dashboard ────────────────────────────────────

    /**
     * GET /api/porter/dashboard
     * Returns 404 (not 500) when the authenticated user has role=PORTER
     * but hasn't completed porter registration yet.
     * The frontend PorterDashboard.jsx should redirect to a registration
     * page on receiving 404.
     */
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

    // ─── NEW ENDPOINT 2: Porter Directory ────────────────────────────────────

    @GetMapping("/directory")
    public ResponseEntity<List<Porter>> porterDirectory(
            @RequestHeader("X-User-Role") String role) {
        if (!STAFF_ROLES.contains(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(porterService.getAllPorters());
    }

    // ─── NEW ENDPOINT 3: Pending Requests ────────────────────────────────────

    @GetMapping("/requests/pending")
    public ResponseEntity<List<PorterBooking>> pendingRequests(
            @RequestHeader("X-User-Role") String role) {
        if (!"PORTER".equals(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(porterService.getPendingBookings());
    }

    // ─── NEW ENDPOINT 4: Active Job ──────────────────────────────────────────

    /**
     * GET /api/porter/active-job
     * Returns 404 with a clear message when porter is not registered.
     * Returns 204 No Content when registered but currently idle.
     */
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

    // ─── NEW ENDPOINT 5: Earnings ─────────────────────────────────────────────

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
