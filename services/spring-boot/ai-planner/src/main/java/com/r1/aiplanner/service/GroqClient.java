package com.r1.aiplanner.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Component
public class GroqClient {

    // ── Groq chat config ──────────────────────────────────────────────────────
    @Value("${groq.api-key:stub}")
    private String groqApiKey;

    @Value("${groq.model:llama3-8b-8192}")
    private String groqModel;

    @Value("${groq.base-url:https://api.groq.com/openai/v1}")
    private String groqBaseUrl;

    // ── OpenAI embedding config (kept for pgvector) ───────────────────────────
    @Value("${openai.api-key:stub}")
    private String openAiApiKey;

    @Value("${openai.embedding-model:text-embedding-3-small}")
    private String embeddingModel;

    @Value("${openai.embedding-dimensions:384}")
    private int embeddingDimensions;

    private final RestTemplate restTemplate = new RestTemplate();

    public String chat(List<Map<String, String>> messages) {
        if ("stub".equals(groqApiKey)) {
            log.info("[STUB Groq] chat() called with {} messages", messages.size());
            return generateStubResponse(messages);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model",      groqModel);
        body.put("messages",   messages);
        body.put("max_tokens", 1024);
        body.put("temperature", 0.7);
        body.put("stream",     false);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    groqBaseUrl + "/chat/completions",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    Map.class
            );
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices =
                    (List<Map<String, Object>>) response.getBody().get("choices");
            @SuppressWarnings("unchecked")
            Map<String, Object> message =
                    (Map<String, Object>) choices.get(0).get("message");
            return (String) message.get("content");

        } catch (Exception e) {
            log.error("[Groq] chat error: {}", e.getMessage());
            // Graceful fallback: try OpenAI if Groq fails and key is available
            if (!"stub".equals(openAiApiKey)) {
                log.warn("[Groq] Falling back to OpenAI for this request");
                return chatOpenAiFallback(messages);
            }
            return "I'm unable to generate a response at this moment. Please try again later.";
        }
    }
    public float[] embed(String text) {
        if ("stub".equals(openAiApiKey)) {
            // Deterministic stub: same text → same stub vector
            float[] stub = new float[embeddingDimensions];
            for (int i = 0; i < embeddingDimensions; i++) {
                stub[i] = (float) Math.sin(i * text.hashCode() % 100) * 0.1f;
            }
            return stub;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openAiApiKey);

        Map<String, Object> body = Map.of(
                "model",      embeddingModel,
                "input",      text,
                "dimensions", embeddingDimensions
        );

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    "https://api.openai.com/v1/embeddings",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    Map.class
            );
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> data =
                    (List<Map<String, Object>>) response.getBody().get("data");
            @SuppressWarnings("unchecked")
            List<Double> embedding = (List<Double>) data.get(0).get("embedding");
            float[] result = new float[embedding.size()];
            for (int i = 0; i < embedding.size(); i++) result[i] = embedding.get(i).floatValue();
            return result;

        } catch (Exception e) {
            log.error("[OpenAI embed] error: {}", e.getMessage());
            return new float[embeddingDimensions];
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private String chatOpenAiFallback(List<Map<String, String>> messages) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openAiApiKey);
        Map<String, Object> body = Map.of(
                "model", "gpt-4o-mini", "messages", messages, "max_tokens", 1024
        );
        try {
            ResponseEntity<Map> resp = restTemplate.exchange(
                    "https://api.openai.com/v1/chat/completions",
                    HttpMethod.POST, new HttpEntity<>(body, headers), Map.class
            );
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> ch = (List<Map<String, Object>>) resp.getBody().get("choices");
            @SuppressWarnings("unchecked")
            Map<String, Object> msg = (Map<String, Object>) ch.get(0).get("message");
            return (String) msg.get("content");
        } catch (Exception ex) {
            log.error("[OpenAI fallback] error: {}", ex.getMessage());
            return "Service temporarily unavailable. Please try again.";
        }
    }

    private String generateStubResponse(List<Map<String, String>> messages) {
        String lastUser = messages.stream()
                .filter(m -> "user".equals(m.get("role")))
                .map(m -> m.get("content"))
                .reduce("", (a, b) -> b);

        if (lastUser.toLowerCase().contains("itinerary") || lastUser.toLowerCase().contains("tour")) {
            return """
                    {
                      "title": "2-Day Ahmedabad Heritage & Culture Tour",
                      "summary": "A curated journey through Ahmedabad's UNESCO World Heritage old city, starting and ending at Ahmedabad Junction.",
                      "days": [
                        {
                          "day": 1,
                          "theme": "Old City Heritage Walk",
                          "activities": [
                            {"time": "09:00", "place": "Sabarmati Ashram", "note": "Gandhi's home — 20 min from ADI station"},
                            {"time": "11:00", "place": "Sidi Saiyyed Mosque", "note": "Famous latticed jali windows — 10 min walk"},
                            {"time": "13:00", "place": "Manek Chowk", "note": "Street food and local snacks"},
                            {"time": "15:00", "place": "Bhadra Fort & Teen Darwaja", "note": "Historic 15th-century gates"},
                            {"time": "18:00", "place": "Sabarmati Riverfront", "note": "Evening walk with views"}
                          ]
                        },
                        {
                          "day": 2,
                          "theme": "Culture & Shopping",
                          "activities": [
                            {"time": "09:30", "place": "Adalaj Stepwell", "note": "30 min drive — stunning 5-storey architecture"},
                            {"time": "12:00", "place": "Calico Museum of Textiles", "note": "Book in advance — world-class collection"},
                            {"time": "15:00", "place": "Law Garden", "note": "Handicrafts, embroidery, local dress"},
                            {"time": "18:00", "place": "CG Road", "note": "Evening dining and shopping"}
                          ]
                        }
                      ],
                      "tips": [
                        "Carry water — Ahmedabad can be very warm",
                        "Auto-rickshaws are best for short distances",
                        "Try Gujarati thali — a complete meal experience"
                      ]
                    }
                    """;
        }
        return "Namaste! I'm the R1 AI Assistant for Ahmedabad Junction. I can help you with porter booking, PNR status, station rooms, lockers, and city itineraries. What do you need help with?";
    }
}
