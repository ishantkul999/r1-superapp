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

@RestController
@RequestMapping("/api/superadmin")
@RequiredArgsConstructor
public class SuperAdminController {

    private final SuperAdminService superAdminService;

    private static final List<String> ADMIN_ROLES = List.of("STATION_CONTROL_ROOM", "SUPERADMIN");
    private static final List<String> SUPERADMIN_ONLY = List.of("SUPERADMIN");

    @GetMapping("/platform-overview")
    public ResponseEntity<PlatformOverviewDto> platformOverview(
            @RequestHeader("X-User-Role") String role) {
        if (!ADMIN_ROLES.contains(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(superAdminService.getPlatformOverview());
    }

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

    @PutMapping("/users/{userId}/block")
    public ResponseEntity<Map<String, String>> blockUser(
            @PathVariable UUID userId,
            @RequestHeader("X-User-Role") String role) {
        if (!ADMIN_ROLES.contains(role)) return ResponseEntity.status(403).build();
        superAdminService.setUserActive(userId, false);
        return ResponseEntity.ok(Map.of("message", "User blocked"));
    }

    @PutMapping("/users/{userId}/unblock")
    public ResponseEntity<Map<String, String>> unblockUser(
            @PathVariable UUID userId,
            @RequestHeader("X-User-Role") String role) {
        if (!ADMIN_ROLES.contains(role)) return ResponseEntity.status(403).build();
        superAdminService.setUserActive(userId, true);
        return ResponseEntity.ok(Map.of("message", "User unblocked"));
    }

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

    @PutMapping("/config")
    public ResponseEntity<Map<String, String>> saveConfig(
            @RequestHeader("X-User-Role") String role,
            @RequestBody Map<String, Object> config) {
        if (!SUPERADMIN_ONLY.contains(role)) return ResponseEntity.status(403).build();
        superAdminService.saveConfig(config);
        return ResponseEntity.ok(Map.of("message", "Configuration saved"));
    }

    @PostMapping("/broadcast")
    public ResponseEntity<Map<String, String>> broadcast(
            @RequestHeader("X-User-Role") String role,
            @RequestBody Map<String, Object> request) {
        if (!ADMIN_ROLES.contains(role)) return ResponseEntity.status(403).build();
        superAdminService.broadcast(request);
        return ResponseEntity.ok(Map.of("message", "Broadcast queued successfully"));
    }
}