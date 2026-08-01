package com.r1.aiplanner.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class GroqChatClient {

    @Value("${groq.api-key:stub}")     private String groqApiKey;
    @Value("${groq.model:llama-3.1-8b-instant}") private String groqModel;
    @Value("${groq.base-url:https://api.groq.com/openai/v1}") private String groqBaseUrl;

    @Value("${ollama.base-url:http://localhost:11434}") private String ollamaBaseUrl;
    @Value("${ollama.embed-model:nomic-embed-text}")    private String ollamaEmbedModel;
    @Value("${embedding.dimensions:768}")               private int embeddingDimensions;

    private final RestTemplate restTemplate = new RestTemplate();

    // ── Chat via Groq ─────────────────────────────────────────────────────────

    public String chat(List<Map<String, String>> messages) {
        if ("stub".equals(groqApiKey)) {
            return buildStubItinerary(messages);
        }
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        h.setBearerAuth(groqApiKey);

        Map<String, Object> body = Map.of(
                "model", groqModel,
                "messages", messages,
                "max_tokens", 1024,
                "temperature", 0.2,
                "stream", false,
                "response_format", Map.of("type", "json_object")
        );
        try {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map> resp = restTemplate.exchange(
                    groqBaseUrl + "/chat/completions", HttpMethod.POST,
                    new HttpEntity<>(body, h), Map.class
            );
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices = (List<Map<String, Object>>) resp.getBody().get("choices");
            @SuppressWarnings("unchecked")
            Map<String, Object> msg = (Map<String, Object>) choices.get(0).get("message");
            return (String) msg.get("content");
        } catch (Exception e) {
            log.error("[Groq/planner] chat error: {}", e.getMessage());
            return "{\"error\":\"AI service temporarily unavailable\"}";
        }
    }

    // ── Embeddings via Ollama ─────────────────────────────────────────────────

    public float[] embed(String text) {
        Map<String, Object> body = Map.of("model", ollamaEmbedModel, "prompt", text);
        try {
            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.APPLICATION_JSON);
            @SuppressWarnings("unchecked")
            ResponseEntity<Map> resp = restTemplate.exchange(
                    ollamaBaseUrl + "/api/embeddings", HttpMethod.POST,
                    new HttpEntity<>(body, h), Map.class
            );
            @SuppressWarnings("unchecked")
            List<Double> emb = (List<Double>) resp.getBody().get("embedding");
            float[] result = new float[emb.size()];
            for (int i = 0; i < emb.size(); i++) result[i] = emb.get(i).floatValue();
            return result;
        } catch (Exception e) {
            log.error("[Ollama/planner] embed error: {}. Is Ollama running?", e.getMessage());
            return new float[embeddingDimensions];
        }
    }

    // ── Dev stub ──────────────────────────────────────────────────────────────

    private String buildStubItinerary(List<Map<String, String>> messages) {
        return """
                {
                  "title": "2-Day Ahmedabad Heritage Tour",
                  "summary": "Starting and ending at Ahmedabad Junction (ADI).",
                  "days": [
                    {
                      "day": 1,
                      "theme": "Old City & Sabarmati",
                      "activities": [
                        {"time": "09:00", "place": "Sabarmati Ashram", "note": "20 min auto from ADI"},
                        {"time": "11:00", "place": "Sidi Saiyyed Mosque", "note": "10 min walk"},
                        {"time": "13:00", "place": "Manek Chowk", "note": "Street food"},
                        {"time": "15:00", "place": "Bhadra Fort", "note": "15th-century gates"},
                        {"time": "18:00", "place": "Sabarmati Riverfront", "note": "Evening walk"}
                      ]
                    },
                    {
                      "day": 2,
                      "theme": "Culture & Shopping",
                      "activities": [
                        {"time": "09:30", "place": "Adalaj Stepwell", "note": "30 min drive"},
                        {"time": "12:00", "place": "Calico Museum of Textiles", "note": "Book in advance"},
                        {"time": "15:00", "place": "Law Garden", "note": "Handicrafts market"},
                        {"time": "18:00", "place": "CG Road", "note": "Dining and shopping"}
                      ]
                    }
                  ],
                  "tips": ["Carry water", "Auto-rickshaws recommended", "Try Gujarati thali"]
                }
                """;
    }
}
