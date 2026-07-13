package com.r1.station.controller;

import com.r1.station.dto.AuditLogDto;
import com.r1.station.service.StationControlService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * StationControlController — adds the missing endpoints called by
 * StationControlDashboard.jsx, AllBookingsPage.jsx, ManageStaffPage.jsx,
 * AuditLogsPage.jsx, and StationAnalyticsPage.jsx.
 *
 * IMPORTANT: The React pages call /api/station-control/**.
 * You have TWO choices:
 *
 * Option A (recommended) — Fix the React URLs to /api/station/**
 *   → This controller's @RequestMapping stays at "/api/station/control"
 *     which maps to existing gateway route /api/station/**.
 *
 * Option B — Keep React URLs as /api/station-control/**
 *   → Add a new gateway route (see gateway patch below).
 *
 * This file uses Option A.
 * Change all React pages accordingly:
 *   '/api/station-control/dashboard'   → '/api/station/control/dashboard'
 *   '/api/station-control/staff'       → '/api/station/control/staff'
 *   '/api/station-control/bookings'    → '/api/station/control/bookings'
 *   '/api/station-control/audit'       → '/api/station/control/audit'
 *   '/api/station-control/analytics'   → '/api/station/control/analytics'
 *
 * DROP THIS FILE at:
 *   services/spring-boot/station-dashboard-service/src/main/java/com/r1/station/controller/StationControlController.java
 */
@RestController
@RequestMapping("/api/station/control")
@RequiredArgsConstructor
public class StationControlController {

    private final StationControlService stationControlService;

    private static final List<String> CONTROL_ROLES =
            List.of("STATION_CONTROL_ROOM", "SUPERADMIN");

    // ─── Dashboard stats ──────────────────────────────────────────────────────

    /**
     * GET /api/station/control/dashboard
     * React page: StationControlDashboard.jsx — stat cards
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard(
            @RequestHeader("X-User-Role") String role) {
        if (!CONTROL_ROLES.contains(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(stationControlService.getDashboardStats());
    }

    // ─── Staff Management ─────────────────────────────────────────────────────

    /**
     * GET /api/station/control/staff
     * React page: ManageStaffPage.jsx — lists all non-USER, non-SUPERADMIN accounts
     */
    @GetMapping("/staff")
    public ResponseEntity<Map<String, Object>> getStaff(
            @RequestHeader("X-User-Role") String role) {
        if (!CONTROL_ROLES.contains(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(Map.of("staff", stationControlService.getStaff()));
    }

    // ─── All Bookings (combined porter + room + locker) ───────────────────────

    /**
     * GET /api/station/control/bookings?type=ALL|PORTER|ROOM|LOCKER
     * React page: AllBookingsPage.jsx
     */
    @GetMapping("/bookings")
    public ResponseEntity<Map<String, Object>> allBookings(
            @RequestHeader("X-User-Role") String role,
            @RequestParam(defaultValue = "ALL") String type) {
        if (!CONTROL_ROLES.contains(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(Map.of("bookings", stationControlService.getAllBookings(type)));
    }

    // ─── Audit Logs ───────────────────────────────────────────────────────────

    /**
     * GET /api/station/control/audit
     * React page: AuditLogsPage.jsx (station-control scoped — not global)
     */
    @GetMapping("/audit")
    public ResponseEntity<Map<String, Object>> auditLogs(
            @RequestHeader("X-User-Role") String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        if (!CONTROL_ROLES.contains(role)) return ResponseEntity.status(403).build();
        List<AuditLogDto> logs = stationControlService.getAuditLogs(page, size);
        return ResponseEntity.ok(Map.of("logs", logs));
    }

    // ─── Analytics ────────────────────────────────────────────────────────────

    /**
     * GET /api/station/control/analytics?period=WEEK|MONTH|YEAR
     * React page: StationAnalyticsPage.jsx
     */
    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> analytics(
            @RequestHeader("X-User-Role") String role,
            @RequestParam(defaultValue = "WEEK") String period) {
        if (!CONTROL_ROLES.contains(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(stationControlService.getAnalytics(period));
    }
}
