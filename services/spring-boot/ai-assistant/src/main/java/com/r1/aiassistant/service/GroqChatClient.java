
package com.r1.aiassistant.service;

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

    // ── Groq (chat) ───────────────────────────────────────────────────────────
    @Value("${groq.api-key:stub}")
    private String groqApiKey;

    @Value("${groq.model:llama3-8b-8192}")
    private String groqModel;

    @Value("${groq.base-url:https://api.groq.com/openai/v1}")
    private String groqBaseUrl;

    // ── Ollama (embeddings) ───────────────────────────────────────────────────
    @Value("${ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${ollama.embed-model:nomic-embed-text}")
    private String ollamaEmbedModel;

    @Value("${embedding.dimensions:768}")
    private int embeddingDimensions;

    private final RestTemplate restTemplate = new RestTemplate();

    // ── Chat via Groq ─────────────────────────────────────────────────────────

    public String chat(List<Map<String, String>> messages) {
        if ("stub".equals(groqApiKey)) {
            log.info("[STUB Groq] chat() - {} messages", messages.size());
            return buildStubResponse(messages);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        Map<String, Object> body = Map.of(
                "model",       groqModel,
                "messages",    messages,
                "max_tokens",  800,
                "temperature", 0.7,
                "stream",      false
        );

        try {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map> resp = restTemplate.exchange(
                    groqBaseUrl + "/chat/completions",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    Map.class
            );
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices = (List<Map<String, Object>>) resp.getBody().get("choices");
            @SuppressWarnings("unchecked")
            Map<String, Object> msg = (Map<String, Object>) choices.get(0).get("message");
            return (String) msg.get("content");

        } catch (Exception e) {
            log.error("[Groq] chat error: {}", e.getMessage());
            return "I'm having trouble connecting right now. Please try again or call 182 for railway help.";
        }
    }

    public float[] embed(String text) {
        Map<String, Object> body = Map.of(
                "model",  ollamaEmbedModel,
                "prompt", text
        );

        try {
            @SuppressWarnings("unchecked")
            ResponseEntity<Map> resp = restTemplate.exchange(
                    ollamaBaseUrl + "/api/embeddings",
                    HttpMethod.POST,
                    new HttpEntity<>(body, new HttpHeaders() {{
                        setContentType(MediaType.APPLICATION_JSON);
                    }}),
                    Map.class
            );
            @SuppressWarnings("unchecked")
            List<Double> embedding = (List<Double>) resp.getBody().get("embedding");
            float[] result = new float[embedding.size()];
            for (int i = 0; i < embedding.size(); i++) result[i] = embedding.get(i).floatValue();
            return result;

        } catch (Exception e) {
            log.error("[Ollama] embed error: {}. Is Ollama running? Try: ollama serve", e.getMessage());
            return new float[embeddingDimensions];   // zero vector fallback
        }
    }

    // ── Stub response for dev (no API key needed) ─────────────────────────────

    private String buildStubResponse(List<Map<String, String>> messages) {
        String last = messages.stream()
                .filter(m -> "user".equals(m.get("role")))
                .map(m -> m.get("content"))
                .reduce("", (a, b) -> b)
                .toLowerCase();

        if (last.contains("porter") || last.contains("coolie") || last.contains("luggage"))
            return "Porter service at ADI: ₹100.30 for luggage up to 40kg. Book via the Porter section in the app.";
        if (last.contains("sos") || last.contains("emergency") || last.contains("help"))
            return "For emergencies, press the SOS button in the app or call 182 (Railway helpline).";
        if (last.contains("locker"))
            return "Digital lockers at Platform 1 & 4: Small ₹30/6hrs, Medium ₹50/6hrs, Large ₹80/6hrs.";
        if (last.contains("room") || last.contains("retire"))
            return "Retiring rooms at ADI: AC ₹600/night, Non-AC ₹350/night. Book via the Rooms section.";
        return "Hello! I'm R1 AI Assistant at Ahmedabad Junction. How can I help you today?";
    }
}
