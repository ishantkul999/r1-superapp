package com.r1.aiassistant.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * AiAssistantOpenAiClient — REPLACE with this thin wrapper.
 *
 * DROP AT:
 *   services/spring-boot/ai-assistant/src/main/java/com/r1/aiassistant/service/AiAssistantOpenAiClient.java
 *
 * This keeps the original class name so AiAssistantService compiles without changes.
 * It simply delegates to GroqChatClient (which uses Groq for chat).
 *
 * AiAssistantService still injects AiAssistantOpenAiClient by name — no change needed there.
 */
@Component
@RequiredArgsConstructor
public class AiAssistantOpenAiClient {

    private final GroqChatClient groqChatClient;

    /**
     * Delegates to Groq (llama3-8b-8192) instead of OpenAI gpt-4o-mini.
     * The method signature is identical — AiAssistantService needs no changes.
     */
    public String chat(List<Map<String, String>> messages) {
        return groqChatClient.chat(messages);
    }
}
