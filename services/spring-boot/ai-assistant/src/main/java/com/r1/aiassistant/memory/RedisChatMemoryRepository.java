package com.r1.aiassistant.memory;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.MessageType;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.memory.ChatMemoryRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class RedisChatMemoryRepository implements ChatMemoryRepository {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${chat.session-ttl-minutes:30}")
    private int sessionTtlMinutes;

    private static final String KEY_PREFIX = "chatmem:";
    private static final String CONVERSATIONS_SET_KEY = "chatmem:conversations";

    private record StoredMessage(String type, String content) {}

    @Override
    public List<String> findConversationIds() {
        Set<String> ids = redisTemplate.opsForSet().members(CONVERSATIONS_SET_KEY);
        return ids == null ? List.of() : new ArrayList<>(ids);
    }

    @Override
    public List<Message> findByConversationId(String conversationId) {
        String raw = redisTemplate.opsForValue().get(KEY_PREFIX + conversationId);
        if (raw == null || raw.isBlank()) return List.of();

        try {
            StoredMessage[] stored = objectMapper.readValue(raw, StoredMessage[].class);
            List<Message> messages = new ArrayList<>();
            for (StoredMessage sm : stored) {
                if (MessageType.USER.getValue().equals(sm.type())) {
                    messages.add(new UserMessage(sm.content()));
                } else if (MessageType.ASSISTANT.getValue().equals(sm.type())) {
                    messages.add(new AssistantMessage(sm.content()));
                }
                // System messages are rebuilt fresh per request (they carry
                // RAG context that changes every turn) — never persisted here.
            }
            return messages;
        } catch (Exception e) {
            log.warn("[ChatMemory] Failed to deserialize history for {}: {}", conversationId, e.getMessage());
            return List.of();
        }
    }

    @Override
    public void saveAll(String conversationId, List<Message> messages) {
        try {
            List<StoredMessage> toStore = messages.stream()
                    .filter(m -> m.getMessageType() == MessageType.USER || m.getMessageType() == MessageType.ASSISTANT)
                    .map(m -> new StoredMessage(m.getMessageType().getValue(), m.getText()))
                    .toList();

            String json = objectMapper.writeValueAsString(toStore);
            redisTemplate.opsForValue().set(KEY_PREFIX + conversationId, json, Duration.ofMinutes(sessionTtlMinutes));
            redisTemplate.opsForSet().add(CONVERSATIONS_SET_KEY, conversationId);
        } catch (Exception e) {
            log.warn("[ChatMemory] Failed to persist history for {}: {}", conversationId, e.getMessage());
        }
    }

    @Override
    public void deleteByConversationId(String conversationId) {
        redisTemplate.delete(KEY_PREFIX + conversationId);
        redisTemplate.opsForSet().remove(CONVERSATIONS_SET_KEY, conversationId);
    }
}