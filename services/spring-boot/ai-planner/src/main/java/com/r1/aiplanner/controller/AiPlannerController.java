package com.r1.aiplanner.controller;

import com.r1.aiplanner.service.AiPlannerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * AiPlannerController — REPLACE the existing file entirely.
 *
 * DROP AT:
 *   services/spring-boot/ai-planner/src/main/java/com/r1/aiplanner/controller/AiPlannerController.java
 *
 * Endpoints:
 *   POST   /api/ai/planner/itinerary            — generate RAG itinerary (existing)
 *   GET    /api/ai/planner/knowledge             — list knowledge base entries  ← NEW
 *   POST   /api/ai/planner/knowledge             — ingest new document          (existing, unchanged)
 *   DELETE /api/ai/planner/knowledge/{id}        — delete entry by id           ← NEW
 *   POST   /api/ai/planner/knowledge/{id}/re-ingest — re-embed existing entry   ← NEW
 *
 * The React page AiKnowledgeBasePage.jsx calls all five of these.
 * The original controller only had POST /itinerary and POST /knowledge,
 * causing the 405 Method Not Allowed on the GET call.
 */
@RestController
@RequestMapping("/api/ai/planner")
@RequiredArgsConstructor
public class AiPlannerController {

    private final AiPlannerService plannerService;

    private static final List<String> ADMIN_ROLES =
            List.of("STATION_CONTROL_ROOM", "SUPERADMIN");

    // ─── Itinerary (EXISTING — unchanged) ────────────────────────────────────

    /**
     * POST /api/ai/planner/itinerary
     * Generates a day-wise RAG itinerary for a user.
     * Called by the User and Flutter apps.
     */
    @PostMapping("/itinerary")
    public ResponseEntity<Map<String, Object>> generateItinerary(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(
                plannerService.generateItinerary(UUID.fromString(userId), request)
        );
    }

    // ─── Knowledge Base — LIST (NEW) ──────────────────────────────────────────

    /**
     * GET /api/ai/planner/knowledge?category=ALL&language=all&page=0&size=50
     *
     * Returns a paginated list of knowledge-base entries.
     * Called by AiKnowledgeBasePage.jsx on mount.
     *
     * The original controller was missing this GET mapping, which caused the
     * 405 Method Not Allowed error — the route existed (POST was registered)
     * but GET was not handled.
     */
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

    // ─── Knowledge Base — INGEST (EXISTING — unchanged) ──────────────────────

    /**
     * POST /api/ai/planner/knowledge
     * Embeds a document and stores it in ai_svc.knowledge_base (pgvector).
     * Body: { content, category, source, language }
     */
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

    // ─── Knowledge Base — DELETE (NEW) ────────────────────────────────────────

    /**
     * DELETE /api/ai/planner/knowledge/{id}
     * Hard-deletes a knowledge-base entry by its UUID.
     * Called by AiKnowledgeBasePage.jsx delete button.
     */
    @DeleteMapping("/knowledge/{id}")
    public ResponseEntity<Map<String, String>> deleteKnowledge(
            @PathVariable UUID id,
            @RequestHeader("X-User-Role") String role) {
        if (!ADMIN_ROLES.contains(role)) return ResponseEntity.status(403).build();
        plannerService.deleteKnowledge(id);
        return ResponseEntity.ok(Map.of("message", "Entry deleted", "id", id.toString()));
    }

    // ─── Knowledge Base — RE-INGEST (NEW) ────────────────────────────────────

    /**
     * POST /api/ai/planner/knowledge/{id}/re-ingest
     * Re-generates the embedding for an existing entry (useful after
     * switching embedding models or fixing corrupted vectors).
     * Called by AiKnowledgeBasePage.jsx re-ingest button.
     */
    @PostMapping("/knowledge/{id}/re-ingest")
    public ResponseEntity<Map<String, Object>> reIngestKnowledge(
            @PathVariable UUID id,
            @RequestHeader("X-User-Role") String role) {
        if (!ADMIN_ROLES.contains(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(plannerService.reIngestKnowledge(id));
    }
}
