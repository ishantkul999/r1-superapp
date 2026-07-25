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

/**
 * REPLACE the existing SupervisorController.java entirely.
 *
 * DROP AT:
 *   services/spring-boot/porter-service/src/main/java/com/r1/porter/controller/SupervisorController.java
 *
 * FIX in this version:
 *   POST /api/supervisor/porters/create now accepts { name, phone, ... }
 *   instead of requiring a pre-existing userId. This matches the spec:
 *   "register porter on supervisor dashboard should have name and mob no field
 *    such that porter whom have access to mobile phone can access porter dashboard"
 *
 *   It calls AuthBridgeService.createOrGetStaffUser() which talks to
 *   auth-service's internal endpoint to create (or find) the auth user for
 *   that phone number, THEN registers the Porter profile against that userId.
 */
@Slf4j
@RestController
@RequestMapping("/api/supervisor")
@RequiredArgsConstructor
public class SupervisorController {

    private final PorterService     porterService;
    private final AuthBridgeService authBridgeService;

    private static final List<String> SUPERVISOR_ROLES =
            List.of("SUPERVISOR", "STATION_CONTROL_ROOM", "SUPERADMIN");

    /** GET /api/supervisor/dashboard */
    @GetMapping("/dashboard")
    public ResponseEntity<SupervisorDashboardDto> dashboard(
            @RequestHeader("X-User-Role") String role) {
        if (!SUPERVISOR_ROLES.contains(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(porterService.getSupervisorDashboard());
    }

    /** GET /api/supervisor/queue/unassigned */
    @GetMapping("/queue/unassigned")
    public ResponseEntity<List<PorterBooking>> unassignedQueue(
            @RequestHeader("X-User-Role") String role) {
        if (!SUPERVISOR_ROLES.contains(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(porterService.getUnassignedPendingBookings());
    }

    /**
     * GET /api/supervisor/porters/available
     *
     * FIX: this was calling porterService.getOnlinePorters(). But online
     * porters (app open, capable of auto-accepting) already had a 15s
     * window to accept before the booking escalated here — offering them
     * again is redundant. The manual-assign pool for escalations should be
     * offline, active porters who don't have the app open and can only be
     * dispatched by phone/radio.
     */
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

    /**
     * POST /api/supervisor/assignments
     * Manual assignment — supervisor assigns ANY registered porter (online or
     * offline) to a booking that wasn't accepted within 15 seconds.
     * This is the "offline porter fallback" required by the spec:
     * "if porter wont accept within 15sec supervisor would assign a offline
     *  porter (having no digital device)"
     */
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

    /**
     * GET /api/supervisor/manual-assignments/active
     *
     * Active (ACCEPTED/IN_PROGRESS) jobs currently held by OFFLINE porters —
     * i.e. jobs this supervisor (or another) manually dispatched to a
     * porter without app access. Backs the "Manually Assigned Jobs" panel
     * so a supervisor can mark one complete on the porter's behalf once
     * it's actually finished (that porter has no way to call
     * /bookings/{id}/complete themselves).
     */
    @GetMapping("/manual-assignments/active")
    public ResponseEntity<List<Map<String, Object>>> activeManualAssignments(
            @RequestHeader("X-User-Role") String role) {
        if (!SUPERVISOR_ROLES.contains(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(porterService.getActiveOfflinePorterAssignments());
    }

    /**
     * POST /api/supervisor/bookings/{bookingId}/complete
     *
     * Marks a job complete on behalf of an offline porter who has no app
     * access. If the assigned porter is actually online, this is rejected —
     * they should complete their own job via the normal PIN-verified flow.
     */
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

    /**
     * POST /api/supervisor/porters/create
     *
     * FIXED: now accepts { name, phone, email, badgeNumber, licenseId,
     * employeeId, serviceType, zone } — NOT a pre-existing userId.
     *
     * Flow:
     *   1. Call auth-service internal endpoint to create (or find existing)
     *      auth user for this phone number, with role=PORTER
     *   2. Register the Porter profile against that userId
     *   3. Porter can now log in via OTP on this phone whenever they have
     *      access to a device — no device required at onboarding time.
     */
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
            // Always return a plain string error message — never an object —
            // to prevent "Objects are not valid as a React child" crashes.
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}