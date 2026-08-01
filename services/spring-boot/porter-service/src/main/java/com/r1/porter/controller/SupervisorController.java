package com.r1.porter.controller;

import com.r1.porter.dto.SupervisorDashboardDto;
import com.r1.porter.entity.Porter;
import com.r1.porter.entity.PorterBooking;
import com.r1.porter.service.PorterService;
import com.r1.porter.service.AuthBridgeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/supervisor")
@RequiredArgsConstructor
public class SupervisorController {

    private final PorterService     porterService;
    private final AuthBridgeService authBridgeService;

    private static final List<String> SUPERVISOR_ROLES =
            List.of("SUPERVISOR", "STATION_CONTROL_ROOM", "SUPERADMIN");

    @GetMapping("/dashboard")
    public ResponseEntity<SupervisorDashboardDto> dashboard(
            @RequestHeader("X-User-Role") String role) {
        if (!SUPERVISOR_ROLES.contains(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(porterService.getSupervisorDashboard());
    }

    @GetMapping("/queue/unassigned")
    public ResponseEntity<List<PorterBooking>> unassignedQueue(
            @RequestHeader("X-User-Role") String role) {
        if (!SUPERVISOR_ROLES.contains(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(porterService.getUnassignedPendingBookings());
    }

    @GetMapping("/porters/available")
    public ResponseEntity<List<Porter>> availablePorters(
            @RequestHeader("X-User-Role") String role) {
        if (!SUPERVISOR_ROLES.contains(role)) return ResponseEntity.status(403).build();
        List<Porter> offline = porterService.getOfflinePorters();
        List<Porter> available = offline.stream()
                .filter(p -> porterService.getActiveJob(p.getUserId()).isEmpty())
                .toList();
        return ResponseEntity.ok(available);
    }

    @PostMapping("/assignments")
    public ResponseEntity<?> assign(
            @RequestHeader("X-User-Role") String role,
            @RequestBody Map<String, String> body) {
        if (!SUPERVISOR_ROLES.contains(role)) return ResponseEntity.status(403).build();
        try {
            UUID bookingId = UUID.fromString(body.get("requestId"));
            UUID porterId  = UUID.fromString(body.get("porterId"));
            PorterBooking booking = porterService.acceptBooking(bookingId, porterId);
            log.info("Supervisor manually assigned booking {} to porter {} (offline fallback)",
                    bookingId, porterId);
            return ResponseEntity.ok(booking);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/manual-assignments/active")
    public ResponseEntity<List<Map<String, Object>>> activeManualAssignments(
            @RequestHeader("X-User-Role") String role) {
        if (!SUPERVISOR_ROLES.contains(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(porterService.getActiveOfflinePorterAssignments());
    }

    @PostMapping("/bookings/{bookingId}/complete")
    public ResponseEntity<?> completeOnBehalfOfPorter(
            @PathVariable UUID bookingId,
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-Id")   String supervisorId) {
        if (!SUPERVISOR_ROLES.contains(role)) return ResponseEntity.status(403).build();
        try {
            PorterBooking booking = porterService.supervisorCompleteBooking(
                    bookingId, UUID.fromString(supervisorId));
            return ResponseEntity.ok(booking);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/supervisor/porters — full directory (online + offline) */
    @GetMapping("/porters")
    public ResponseEntity<List<Porter>> allPorters(
            @RequestHeader("X-User-Role") String role) {
        if (!SUPERVISOR_ROLES.contains(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(porterService.getAllPorters());
    }

    @PostMapping("/porters/create")
    public ResponseEntity<?> createPorter(
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-Id")   String supervisorId,
            @RequestBody Map<String, Object> request) {
        if (!SUPERVISOR_ROLES.contains(role)) return ResponseEntity.status(403).build();

        String name  = (String) request.get("name");
        String phone = (String) request.get("phone");

        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Porter name is required"));
        }
        if (phone == null || phone.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Porter mobile number is required"));
        }

        try {
            // Step 1: Create or find the auth user for this phone (role=PORTER)
            UUID userId = authBridgeService.createOrGetStaffUser(
                    phone, name, (String) request.get("email"), "PORTER"
            );

            // Step 2: Register the Porter profile
            Map<String, Object> porterRequest = new java.util.HashMap<>(request);
            porterRequest.put("userId", userId.toString());
            porterRequest.put("fullName", name);
            porterRequest.put("phone", phone);
            porterRequest.put("onboardedBy", supervisorId);

            Porter porter = porterService.registerPorter(porterRequest);

            log.info("Supervisor {} onboarded new porter: {} ({}) badge={}",
                    supervisorId, name, phone, porter.getBadgeNumber());

            return ResponseEntity.status(201).body(Map.of(
                    "message", "Porter \"" + name + "\" registered successfully. They can log in with OTP on " + phone,
                    "porter", porter,
                    "userId", userId.toString()
            ));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}