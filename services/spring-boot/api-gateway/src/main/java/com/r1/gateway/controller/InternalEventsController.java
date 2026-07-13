package com.r1.gateway.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/internal")
@RequiredArgsConstructor
public class InternalEventsController {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${internal.events.secret}")
    private String internalSecret;

    @PostMapping("/events")
    public ResponseEntity<Map<String, String>> publishEvent(
            @RequestHeader("X-Internal-Secret") String secret,
            @RequestBody Map<String, Object> payload) {

        if (!internalSecret.equals(secret)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized"));
        }

        String topic = (String) payload.get("topic");
        Object eventPayload = payload.get("payload");

        if (topic == null || topic.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "topic is required"));
        }

        // Allowed topics from Node.js
        if (!isAllowedTopic(topic)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Topic not allowed: " + topic));
        }

        try {
            kafkaTemplate.send(topic, eventPayload);
            log.info("Bridged event to Kafka topic: {}", topic);
            return ResponseEntity.ok(Map.of("status", "published", "topic", topic));
        } catch (Exception e) {
            log.error("Failed to publish to Kafka topic {}: {}", topic, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to publish event"));
        }
    }

    private boolean isAllowedTopic(String topic) {
        return switch (topic) {
            case "sos.triggered", "sos.resolved", "audit.events",
                 "porter.created", "user.registered" -> true;
            default -> false;
        };
    }
}
