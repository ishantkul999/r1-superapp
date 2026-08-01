package com.r1.station.controller;

import com.r1.station.dto.AuditLogDto;
import com.r1.station.service.StationControlService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/station/control")
@RequiredArgsConstructor
public class StationControlController {

    private final StationControlService stationControlService;

    private static final List<String> CONTROL_ROLES =
            List.of("STATION_CONTROL_ROOM", "SUPERADMIN");

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard(
            @RequestHeader("X-User-Role") String role) {
        if (!CONTROL_ROLES.contains(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(stationControlService.getDashboardStats());
    }

    @GetMapping("/staff")
    public ResponseEntity<Map<String, Object>> getStaff(
            @RequestHeader("X-User-Role") String role) {
        if (!CONTROL_ROLES.contains(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(Map.of("staff", stationControlService.getStaff()));
    }

    @GetMapping("/bookings")
    public ResponseEntity<Map<String, Object>> allBookings(
            @RequestHeader("X-User-Role") String role,
            @RequestParam(defaultValue = "ALL") String type) {
        if (!CONTROL_ROLES.contains(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(Map.of("bookings", stationControlService.getAllBookings(type)));
    }

    @GetMapping("/audit")
    public ResponseEntity<Map<String, Object>> auditLogs(
            @RequestHeader("X-User-Role") String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        if (!CONTROL_ROLES.contains(role)) return ResponseEntity.status(403).build();
        List<AuditLogDto> logs = stationControlService.getAuditLogs(page, size);
        return ResponseEntity.ok(Map.of("logs", logs));
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> analytics(
            @RequestHeader("X-User-Role") String role,
            @RequestParam(defaultValue = "WEEK") String period) {
        if (!CONTROL_ROLES.contains(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(stationControlService.getAnalytics(period));
    }
}
