package com.r1.aiplanner.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * OpenAiClient — REPLACE with this thin wrapper.
 *
 * DROP AT:
 *   services/spring-boot/ai-planner/src/main/java/com/r1/aiplanner/service/OpenAiClient.java
 *
 * Keeps the original class name so AiPlannerService compiles without changes.
 * Delegates chat() → Groq (free tier), embed() → Ollama (free, local).
 */
@Component
@RequiredArgsConstructor
public class OpenAiClient {

    private final GroqChatClient groqChatClient;

    /** Chat via Groq — same signature as before, zero code change in AiPlannerService */
    public String chat(List<Map<String, String>> messages) {
        return groqChatClient.chat(messages);
    }

    /** Embeddings via Ollama (nomic-embed-text, 768-dim) — replaces OpenAI embeddings */
    public float[] embed(String text) {
        return groqChatClient.embed(text);
    }
}
