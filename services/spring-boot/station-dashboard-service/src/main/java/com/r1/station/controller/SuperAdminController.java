package com.r1.station.controller;

import com.r1.station.dto.AuditLogDto;
import com.r1.station.dto.PlatformOverviewDto;
import com.r1.station.dto.UserSummaryDto;
import com.r1.station.service.SuperAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * SuperAdminController lives inside station-dashboard-service (port 8094).
 *
 * Gateway routes added (see gateway/application.yml patch):
 *   /api/superadmin/**  →  station-dashboard-service:8094
 *
 * This handles:
 *   GET  /api/superadmin/platform-overview   → SuperAdminDashboard.jsx
 *   GET  /api/superadmin/users               → UserManagementPage.jsx
 *   PUT  /api/superadmin/users/:id/block     → UserManagementPage.jsx
 *   PUT  /api/superadmin/users/:id/unblock   → UserManagementPage.jsx
 *   GET  /api/superadmin/audit               → GlobalAuditLogsPage.jsx
 *   PUT  /api/superadmin/config              → SystemConfigPage.jsx
 *   POST /api/superadmin/broadcast           → BroadcastPage.jsx
 */
@RestController
@RequestMapping("/api/superadmin")
@RequiredArgsConstructor
public class SuperAdminController {

    private final SuperAdminService superAdminService;

    private static final List<String> ADMIN_ROLES = List.of("STATION_CONTROL_ROOM", "SUPERADMIN");
    private static final List<String> SUPERADMIN_ONLY = List.of("SUPERADMIN");

    // ─── Platform Overview ────────────────────────────────────────────────────

    /**
     * GET /api/superadmin/platform-overview
     * Returns aggregate platform stats: total users, porters, bookings, revenue, SOS count.
     * React page: SuperAdminDashboard.jsx
     */
    @GetMapping("/platform-overview")
    public ResponseEntity<PlatformOverviewDto> platformOverview(
            @RequestHeader("X-User-Role") String role) {
        if (!ADMIN_ROLES.contains(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(superAdminService.getPlatformOverview());
    }

    // ─── User Management ──────────────────────────────────────────────────────

    /**
     * GET /api/superadmin/users?role=ALL
     * Returns all users across all roles.
     * React page: UserManagementPage.jsx
     */
    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getAllUsers(
            @RequestHeader("X-User-Role") String role,
            @RequestParam(defaultValue = "ALL") String roleFilter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        if (!ADMIN_ROLES.contains(role)) return ResponseEntity.status(403).build();
        List<UserSummaryDto> users = superAdminService.getAllUsers(roleFilter, page, size);
        return ResponseEntity.ok(Map.of(
                "users", users,
                "page", page,
                "size", size,
                "total", users.size()
        ));
    }

    /**
     * PUT /api/superadmin/users/{userId}/block
     * Soft-blocks a user (sets is_active = false in auth_svc.users).
     */
    @PutMapping("/users/{userId}/block")
    public ResponseEntity<Map<String, String>> blockUser(
            @PathVariable UUID userId,
            @RequestHeader("X-User-Role") String role) {
        if (!ADMIN_ROLES.contains(role)) return ResponseEntity.status(403).build();
        superAdminService.setUserActive(userId, false);
        return ResponseEntity.ok(Map.of("message", "User blocked"));
    }

    /**
     * PUT /api/superadmin/users/{userId}/unblock
     * Re-activates a blocked user.
     */
    @PutMapping("/users/{userId}/unblock")
    public ResponseEntity<Map<String, String>> unblockUser(
            @PathVariable UUID userId,
            @RequestHeader("X-User-Role") String role) {
        if (!ADMIN_ROLES.contains(role)) return ResponseEntity.status(403).build();
        superAdminService.setUserActive(userId, true);
        return ResponseEntity.ok(Map.of("message", "User unblocked"));
    }

    // ─── Global Audit Logs ────────────────────────────────────────────────────

    /**
     * GET /api/superadmin/audit?service=ALL&page=0&size=50
     * React page: GlobalAuditLogsPage.jsx
     */
    @GetMapping("/audit")
    public ResponseEntity<Map<String, Object>> auditLogs(
            @RequestHeader("X-User-Role") String role,
            @RequestParam(defaultValue = "ALL") String service,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        if (!ADMIN_ROLES.contains(role)) return ResponseEntity.status(403).build();
        List<AuditLogDto> logs = superAdminService.getAuditLogs(service, page, size);
        return ResponseEntity.ok(Map.of("logs", logs, "page", page, "size", size));
    }

    // ─── System Config ────────────────────────────────────────────────────────

    /**
     * PUT /api/superadmin/config
     * Persists mock-mode toggles and system config values.
     * React page: SystemConfigPage.jsx
     */
    @PutMapping("/config")
    public ResponseEntity<Map<String, String>> saveConfig(
            @RequestHeader("X-User-Role") String role,
            @RequestBody Map<String, Object> config) {
        if (!SUPERADMIN_ONLY.contains(role)) return ResponseEntity.status(403).build();
        superAdminService.saveConfig(config);
        return ResponseEntity.ok(Map.of("message", "Configuration saved"));
    }

    // ─── Broadcast ────────────────────────────────────────────────────────────

    /**
     * POST /api/superadmin/broadcast
     * Body: { title, body, targetRoles: [], type: "PUSH"|"SMS"|"IN_APP" }
     * React page: BroadcastPage.jsx
     */
    @PostMapping("/broadcast")
    public ResponseEntity<Map<String, String>> broadcast(
            @RequestHeader("X-User-Role") String role,
            @RequestBody Map<String, Object> request) {
        if (!ADMIN_ROLES.contains(role)) return ResponseEntity.status(403).build();
        superAdminService.broadcast(request);
        return ResponseEntity.ok(Map.of("message", "Broadcast queued successfully"));
    }
}