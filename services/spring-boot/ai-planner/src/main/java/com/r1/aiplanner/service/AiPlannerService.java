package com.r1.aiplanner.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * AiPlannerService — now backed by Spring AI (ChatClient + VectorStore)
 * instead of hand-rolled RestTemplate calls to Groq/Ollama.
 *
 * WHAT CHANGED AND WHY:
 *   - Chat: groqClient.chat(List<Map<String,String>>) -> chatClient.prompt()...
 *     Same effective call (Groq, via the OpenAI-compatible starter), but
 *     Spring AI handles the HTTP plumbing, retries, and response parsing.
 *   - Embeddings + retrieval: manual embed() + raw "ORDER BY embedding <=>"
 *     SQL -> vectorStore.similaritySearch(...). Spring AI's PgVectorStore
 *     embeds the query internally (via the auto-configured Ollama
 *     EmbeddingModel) and does the cosine search for you.
 *   - Ingestion: manual float[] embed() + vector-string SQL insert ->
 *     vectorStore.add(List.of(document)). Category/source/language/
 *     ingestedBy now live in the Document's metadata map, since Spring AI's
 *     managed table (ai_svc.vector_store) only has id/content/metadata/
 *     embedding columns -- not our old bespoke ai_svc.knowledge_base schema.
 *   - List/delete/re-ingest still use JdbcTemplate against vector_store
 *     directly, since VectorStore's interface doesn't expose a generic
 *     "list all with filters + pagination" operation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiPlannerService {

    private final ChatClient   chatClient;
    private final VectorStore  vectorStore;
    private final JdbcTemplate jdbcTemplate;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${ai.planner.rag-top-k:5}")
    private int ragTopK;

    // -- Generate Itinerary --------------------------------------------------
    public Map<String, Object> generateItinerary(UUID userId, Map<String, Object> request) {
        String language    = (String) request.getOrDefault("language", "en");
        @SuppressWarnings("unchecked")
        List<String> interests = (List<String>) request.getOrDefault("interests", List.of("heritage", "food"));
        int budgetMin      = ((Number) request.getOrDefault("budgetMin",  500)).intValue();
        int budgetMax      = ((Number) request.getOrDefault("budgetMax", 3000)).intValue();
        int durationDays   = ((Number) request.getOrDefault("durationDays", 2)).intValue();

        String query   = "Ahmedabad tourism itinerary " + String.join(" ", interests)
                + " budget " + budgetMax + " INR " + durationDays + " days";
        String context = retrieveContext(query, ragTopK);

        String systemPrompt = "You are R1 AI Travel Planner for Ahmedabad Junction railway station, India. " +
                "Generate detailed, practical day-wise itineraries in JSON format. " +
                "All places must be reachable from Ahmedabad Junction (ADI). " +
                "Use the provided context about the station and city. " +
                "Always respond in " +
                switch (language) { case "hi" -> "Hindi"; case "gu" -> "Gujarati"; default -> "English"; } +
                ". Output ONLY valid JSON, no markdown code fences, matching EXACTLY this schema " +
                "(use these exact key names for every field, do not rename or omit any of them): " +
                "{ \"title\": string, \"summary\": string, " +
                "\"days\": [ { \"day\": number, \"theme\": string, " +
                "\"activities\": [ { \"time\": string, \"place\": string, \"note\": string } ] } ], " +
                "\"tips\": [ string ] }. " +
                "\"place\" must be the specific name of the location/activity (e.g. \"Sabarmati Ashram\"), " +
                "and \"note\" must be a short practical detail (travel time, cost, or tip) -- never leave " +
                "\"place\" or \"note\" empty. Context:\n" + context;

        String userPrompt = String.format(
                "Generate a %d-day Ahmedabad itinerary starting and ending at Ahmedabad Junction. " +
                        "Interests: %s. Daily budget: Rs.%d-Rs.%d. " +
                        "Include estimated travel times and admission costs where known. " +
                        "Return as valid JSON only.",
                durationDays, interests, budgetMin, budgetMax
        );

        String response;
        try {
            response = chatClient.prompt()
                    .system(systemPrompt)
                    .user(userPrompt)
                    .call()
                    .content();
        } catch (Exception e) {
            log.error("[AiPlanner] Chat call failed: {}", e.getMessage());
            response = "{\"error\":\"AI service temporarily unavailable\"}";
        }

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

    // -- Ingest Knowledge Document -------------------------------------------
    public Map<String, Object> ingestKnowledge(String content, String category,
                                               String source, String language, UUID ingestedBy) {
        Document document = new Document(content, Map.of(
                "category",   category,
                "source",     source,
                "language",   language,
                "ingestedBy", ingestedBy.toString()
        ));

        try {
            // VectorStore.add() embeds via the auto-configured Ollama
            // EmbeddingModel internally -- no manual embed() call needed.
            vectorStore.add(List.of(document));

            try {
                kafkaTemplate.send("ai.knowledge.ingested", Map.of(
                        "category", category, "source", source,
                        "language", language, "ingestedBy", ingestedBy.toString()
                ));
            } catch (Exception kafkaErr) {
                log.warn("[AiPlanner] Kafka publish failed (non-fatal): {}", kafkaErr.getMessage());
            }
            return Map.of("status", "ingested", "category", category, "embeddingModel", "nomic-embed-text", "id", document.getId());
        } catch (Exception e) {
            log.error("[AiPlanner] Ingestion failed: {}", e.getMessage());
            throw new RuntimeException("Failed to ingest knowledge: " + e.getMessage());
        }
    }

    // -- List Knowledge Base --------------------------------------------------
    // Reads the same ai_svc.vector_store table Spring AI's PgVectorStore
    // manages; category/source/language/ingestedBy are inside `metadata`.
    public List<Map<String, Object>> listKnowledge(String category, String language, int page, int size) {
        StringBuilder sql = new StringBuilder(
                "SELECT id, content, " +
                        "metadata->>'category' AS category, " +
                        "metadata->>'source' AS source, " +
                        "metadata->>'language' AS language, " +
                        "metadata->>'ingestedBy' AS ingested_by " +
                        "FROM ai_svc.vector_store WHERE 1=1"
        );
        List<Object> params = new ArrayList<>();

        if (!"ALL".equalsIgnoreCase(category)) { sql.append(" AND metadata->>'category' = ?"); params.add(category); }
        if (!"all".equalsIgnoreCase(language))  { sql.append(" AND metadata->>'language' = ?"); params.add(language); }

        sql.append(" ORDER BY id LIMIT ? OFFSET ?");
        params.add(size);
        params.add((long) page * size);

        try {
            return jdbcTemplate.queryForList(sql.toString(), params.toArray());
        } catch (Exception e) {
            log.error("[AiPlanner] listKnowledge error: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    // -- Delete Knowledge Entry -----------------------------------------------
    public void deleteKnowledge(UUID id) {
        try {
            vectorStore.delete(List.of(id.toString()));
        } catch (Exception e) {
            throw new NoSuchElementException("Knowledge entry not found: " + id);
        }
        log.info("[AiPlanner] Deleted knowledge entry: {}", id);
    }

    // -- Re-ingest (re-embed) Knowledge Entry --------------------------------
    public Map<String, Object> reIngestKnowledge(UUID id) {
        Map<String, Object> row;
        try {
            row = jdbcTemplate.queryForMap(
                    "SELECT id, content, " +
                            "metadata->>'category' AS category, " +
                            "metadata->>'source' AS source, " +
                            "metadata->>'language' AS language, " +
                            "metadata->>'ingestedBy' AS ingested_by " +
                            "FROM ai_svc.vector_store WHERE id = ?::uuid",
                    id.toString()
            );
        } catch (Exception e) {
            throw new NoSuchElementException("Knowledge entry not found: " + id);
        }

        // Re-embedding = delete + re-add with the same id, so the
        // knowledge base admin UI's row doesn't change identity.
        vectorStore.delete(List.of(id.toString()));
        Document document = new Document(id.toString(), (String) row.get("content"), Map.of(
                "category",   row.get("category"),
                "source",     row.get("source"),
                "language",   row.get("language"),
                "ingestedBy", row.get("ingested_by")
        ));
        vectorStore.add(List.of(document));

        log.info("[AiPlanner] Re-ingested knowledge entry: {} (category={})", id, row.get("category"));

        return Map.of(
                "status",   "re-ingested",
                "id",       id.toString(),
                "category", row.get("category"),
                "source",   row.get("source"),
                "embeddingModel", "nomic-embed-text"
        );
    }

    // -- Private: RAG Context Retrieval --------------------------------------
    private String retrieveContext(String query, int limit) {
        try {
            List<Document> results = vectorStore.similaritySearch(
                    SearchRequest.builder()
                            .query(query)
                            .topK(limit)
                            .build()
            );
            return results.stream()
                    .map(Document::getText)
                    .collect(Collectors.joining("\n---\n"));
        } catch (Exception e) {
            log.warn("[AiPlanner] Vector search failed (using fallback context): {}", e.getMessage());
            return "Ahmedabad Junction (ADI) is a major railway station in Ahmedabad, Gujarat, India. " +
                    "It offers porter services, retiring rooms, digital lockers, and an AI travel assistant.";
        }
    }
}
