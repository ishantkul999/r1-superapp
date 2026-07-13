package com.r1.auth.kafka;

import com.r1.auth.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuthEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishAuthRegistered(User user) {
        Map<String, Object> event = Map.of(
                "eventType", "AUTH_REGISTERED",
                "userId", user.getId().toString(),
                "phone", user.getPhone(),
                "role", user.getRole(),
                "timestamp", Instant.now().toString()
        );

        kafkaTemplate.send("auth.registered", user.getId().toString(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish auth.registered for user {}: {}", user.getId(), ex.getMessage());
                    } else {
                        log.info("Published auth.registered for user {}", user.getId());
                    }
                });
    }

    public void publishAuditEvent(String action, String userId, String role, Map<String, Object> details) {
        Map<String, Object> event = Map.of(
                "action", action,
                "actorUserId", userId != null ? userId : "SYSTEM",
                "actorRole", role != null ? role : "SYSTEM",
                "sourceService", "auth-service",
                "details", details,
                "timestamp", Instant.now().toString()
        );

        kafkaTemplate.send("audit.events", event);
    }
}
