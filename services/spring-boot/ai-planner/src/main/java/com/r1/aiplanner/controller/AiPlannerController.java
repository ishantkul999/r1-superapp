package com.r1.aiplanner.controller;

import com.r1.aiplanner.service.AiPlannerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai/planner")
@RequiredArgsConstructor
public class AiPlannerController {

    private final AiPlannerService plannerService;

    private static final List<String> ADMIN_ROLES =
            List.of("STATION_CONTROL_ROOM", "SUPERADMIN");

    @PostMapping("/itinerary")
    public ResponseEntity<Map<String, Object>> generateItinerary(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(
                plannerService.generateItinerary(UUID.fromString(userId), request)
        );
    }

    @GetMapping("/knowledge")
    public ResponseEntity<List<Map<String, Object>>> listKnowledge(
            @RequestHeader("X-User-Role") String role,
            @RequestParam(defaultValue = "ALL") String category,
            @RequestParam(defaultValue = "all")  String language,
            @RequestParam(defaultValue = "0")    int page,
            @RequestParam(defaultValue = "50")   int size) {
        if (!ADMIN_ROLES.contains(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(
                plannerService.listKnowledge(category, language, page, size)
        );
    }

    @PostMapping("/knowledge")
    public ResponseEntity<Map<String, Object>> ingestKnowledge(
            @RequestHeader("X-User-Id")   String userId,
            @RequestHeader("X-User-Role") String role,
            @RequestBody Map<String, Object> body) {
        if (!ADMIN_ROLES.contains(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(plannerService.ingestKnowledge(
                (String) body.get("content"),
                (String) body.getOrDefault("category", "GENERAL"),
                (String) body.getOrDefault("source",   "Manual"),
                (String) body.getOrDefault("language", "en"),
                UUID.fromString(userId)
        ));
    }

    @DeleteMapping("/knowledge/{id}")
    public ResponseEntity<Map<String, String>> deleteKnowledge(
            @PathVariable UUID id,
            @RequestHeader("X-User-Role") String role) {
        if (!ADMIN_ROLES.contains(role)) return ResponseEntity.status(403).build();
        plannerService.deleteKnowledge(id);
        return ResponseEntity.ok(Map.of("message", "Entry deleted", "id", id.toString()));
    }

    @PostMapping("/knowledge/{id}/re-ingest")
    public ResponseEntity<Map<String, Object>> reIngestKnowledge(
            @PathVariable UUID id,
            @RequestHeader("X-User-Role") String role) {
        if (!ADMIN_ROLES.contains(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(plannerService.reIngestKnowledge(id));
    }
}
