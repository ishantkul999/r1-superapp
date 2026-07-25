package com.r1.aiplanner.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Spring AI wiring for ai-planner.
 *
 * ChatClient.Builder is auto-configured by spring-ai-starter-model-openai,
 * backed by whichever ChatModel spring.ai.model.chat selects (see
 * application.yml — set to "openai", pointed at Groq's OpenAI-compatible
 * endpoint via spring.ai.openai.base-url).
 *
 * VectorStore and EmbeddingModel (Ollama-backed) are fully auto-configured
 * by spring-ai-starter-vector-store-pgvector + spring-ai-starter-model-ollama
 * — no bean definitions needed here for those; just inject VectorStore
 * directly wherever it's needed.
 */
@Configuration
public class AiConfig {

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder.build();
    }
}
