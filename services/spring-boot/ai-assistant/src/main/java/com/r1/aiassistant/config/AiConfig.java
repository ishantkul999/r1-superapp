package com.r1.aiassistant.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Spring AI wiring for ai-assistant. Same pattern as ai-planner's AiConfig —
 * ChatClient backed by Groq (via spring.ai.model.chat=openai + base-url
 * override), VectorStore/EmbeddingModel auto-configured and Ollama-backed,
 * pointed at the SAME ai_svc.vector_store table ai-planner's Knowledge Base
 * admin page ingests into.
 */
@Configuration
public class AiConfig {

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder.build();
    }
}
