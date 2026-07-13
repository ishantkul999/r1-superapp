package com.r1.aiplanner.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * AiPlannerService — REPLACE the existing file.
 *
 * DROP AT:
 *   services/spring-boot/ai-planner/src/main/java/com/r1/aiplanner/service/AiPlannerService.java
 *
 * Changes from previous version:
 *   - OpenAiClient → GroqClient  (chat inference now via Groq API)
 *   - embed() still delegates to GroqClient.embed() which internally uses OpenAI
 *   - All other business logic is identical
 *
 * The GroqClient maintains the same method signatures (chat, embed) as OpenAiClient,
 * so no other files need to change except the constructor injection type.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiPlannerService {

    // ── Groq replaces OpenAiClient for chat; embed() still uses OpenAI internally ──
    private final GroqClient       groqClient;
    private final JdbcTemplate     jdbcTemplate;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    // ── Generate Itinerary (unchanged logic, now uses Groq for chat) ──────────
    public Map<String, Object> generateItinerary(UUID userId, Map<String, Object> request) {
        String language    = (String) request.getOrDefault("language", "en");
        @SuppressWarnings("unchecked")
        List<String> interests = (List<String>) request.getOrDefault("interests", List.of("heritage", "food"));
        int budgetMin      = ((Number) request.getOrDefault("budgetMin",  500)).intValue();
        int budgetMax      = ((Number) request.getOrDefault("budgetMax", 3000)).intValue();
        int durationDays   = ((Number) request.getOrDefault("durationDays", 2)).intValue();

        String query   = "Ahmedabad tourism itinerary " + String.join(" ", interests)
                + " budget " + budgetMax + " INR " + durationDays + " days";
        String context = retrieveContext(query, 5);

        String systemPrompt = "You are R1 AI Travel Planner for Ahmedabad Junction railway station, India. " +
                "Generate detailed, practical day-wise itineraries in JSON format. " +
                "All places must be reachable from Ahmedabad Junction (ADI). " +
                "Use the provided context about the station and city. " +
                "Always respond in " +
                switch (language) { case "hi" -> "Hindi"; case "gu" -> "Gujarati"; default -> "English"; } +
                ". Output ONLY valid JSON with keys: title, summary, days (array), tips (array). Context:\n" + context;

        String userPrompt = String.format(
                "Generate a %d-day Ahmedabad itinerary starting and ending at Ahmedabad Junction. " +
                        "Interests: %s. Daily budget: ₹%d–₹%d. " +
                        "Include estimated travel times and admission costs where known. " +
                        "Return as valid JSON only.",
                durationDays, interests, budgetMin, budgetMax
        );

        // Uses Groq (llama3-8b-8192) — much faster than GPT-4o-mini for this use case
        String response = groqClient.chat(List.of(
                Map.of("role", "system",  "content", systemPrompt),
                Map.of("role", "user",    "content", userPrompt)
        ));

        try {
            jdbcTemplate.update(
                    "INSERT INTO ai_svc.itineraries " +
                            "(user_id, budget_min, budget_max, duration_days, interests, itinerary_json, language) " +
                            "VALUES (?::uuid, ?, ?, ?, ?, ?::jsonb, ?)",
                    userId.toString(), budgetMin, budgetMax, durationDays,
                    interests.toArray(new String[0]), response, language
            );
        } catch (Exception e) {
            log.warn("[AiPlanner] Failed to persist itinerary for user {}: {}", userId, e.getMessage());
        }

        return Map.of("itinerary", response, "language", language, "model", "groq/llama3-8b-8192");
    }

    // ── Ingest Knowledge Document ─────────────────────────────────────────────
    public Map<String, Object> ingestKnowledge(String content, String category,
                                               String source, String language, UUID ingestedBy) {
        // Embedding still uses OpenAI (via groqClient.embed() which delegates internally)
        float[] embedding = groqClient.embed(content);
        String vectorStr  = Arrays.toString(embedding).replace("[", "{").replace("]", "}");

        try {
            jdbcTemplate.update(
                    "INSERT INTO ai_svc.knowledge_base " +
                            "(content, category, source, language, embedding, ingested_by) " +
                            "VALUES (?, ?, ?, ?, ?::vector, ?::uuid)",
                    content, category, source, language, vectorStr, ingestedBy.toString()
            );
            try {
                kafkaTemplate.send("ai.knowledge.ingested", Map.of(
                        "category", category, "source", source,
                        "language", language, "ingestedBy", ingestedBy.toString()
                ));
            } catch (Exception kafkaErr) {
                log.warn("[AiPlanner] Kafka publish failed (non-fatal): {}", kafkaErr.getMessage());
            }
            return Map.of("status", "ingested", "category", category, "embeddingModel", "text-embedding-3-small");
        } catch (Exception e) {
            log.error("[AiPlanner] Ingestion failed: {}", e.getMessage());
            throw new RuntimeException("Failed to ingest knowledge: " + e.getMessage());
        }
    }

    // ── List Knowledge Base ───────────────────────────────────────────────────
    public List<Map<String, Object>> listKnowledge(String category, String language, int page, int size) {
        StringBuilder sql = new StringBuilder(
                "SELECT id, content, category, source, language, ingested_by, created_at, updated_at " +
                        "FROM ai_svc.knowledge_base WHERE 1=1"
        );
        List<Object> params = new ArrayList<>();

        if (!"ALL".equalsIgnoreCase(category)) { sql.append(" AND category = ?"); params.add(category); }
        if (!"all".equalsIgnoreCase(language))  { sql.append(" AND language = ?"); params.add(language); }

        sql.append(" ORDER BY created_at DESC LIMIT ? OFFSET ?");
        params.add(size);
        params.add((long) page * size);

        try {
            return jdbcTemplate.queryForList(sql.toString(), params.toArray());
        } catch (Exception e) {
            log.error("[AiPlanner] listKnowledge error: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    // ── Delete Knowledge Entry ────────────────────────────────────────────────
    public void deleteKnowledge(UUID id) {
        int rows = jdbcTemplate.update(
                "DELETE FROM ai_svc.knowledge_base WHERE id = ?::uuid", id.toString()
        );
        if (rows == 0) throw new NoSuchElementException("Knowledge entry not found: " + id);
        log.info("[AiPlanner] Deleted knowledge entry: {}", id);
    }

    // ── Re-ingest (re-embed) Knowledge Entry ─────────────────────────────────
    public Map<String, Object> reIngestKnowledge(UUID id) {
        Map<String, Object> row;
        try {
            row = jdbcTemplate.queryForMap(
                    "SELECT id, content, category, source FROM ai_svc.knowledge_base WHERE id = ?::uuid",
                    id.toString()
            );
        } catch (Exception e) {
            throw new NoSuchElementException("Knowledge entry not found: " + id);
        }

        float[] embedding = groqClient.embed((String) row.get("content"));
        String vectorStr  = Arrays.toString(embedding).replace("[", "{").replace("]", "}");

        jdbcTemplate.update(
                "UPDATE ai_svc.knowledge_base SET embedding = ?::vector, updated_at = NOW() WHERE id = ?::uuid",
                vectorStr, id.toString()
        );
        log.info("[AiPlanner] Re-ingested knowledge entry: {} (category={})", id, row.get("category"));

        return Map.of(
                "status",   "re-ingested",
                "id",       id.toString(),
                "category", row.get("category"),
                "source",   row.get("source"),
                "embeddingModel", "text-embedding-3-small"
        );
    }

    // ── Private: RAG Context Retrieval ────────────────────────────────────────
    private String retrieveContext(String query, int limit) {
        try {
            float[] queryEmbedding = groqClient.embed(query);
            String vectorStr = Arrays.toString(queryEmbedding)
                    .replace("[", "{").replace("]", "}");

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT content FROM ai_svc.knowledge_base " +
                            "ORDER BY embedding <=> ?::vector LIMIT ?",
                    vectorStr, limit
            );

            StringBuilder ctx = new StringBuilder();
            for (Map<String, Object> r : rows) ctx.append(r.get("content")).append("\n---\n");
            return ctx.toString();

        } catch (Exception e) {
            log.warn("[AiPlanner] Vector search failed (using fallback context): {}", e.getMessage());
            return "Ahmedabad Junction (ADI) is a major railway station in Ahmedabad, Gujarat, India. " +
                    "It offers porter services, retiring rooms, digital lockers, and an AI travel assistant.";
        }
    }
}

