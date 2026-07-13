package com.r1.aiassistant.controller;

import com.r1.aiassistant.service.AiAssistantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai/assistant")
@RequiredArgsConstructor
public class AiAssistantController {

    private final AiAssistantService assistantService;

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Map<String, String> body) {
        String message = body.get("message");
        String language = body.getOrDefault("language", "en");

        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "message is required"));
        }

        return ResponseEntity.ok(
                assistantService.chat(UUID.fromString(userId), message, language));
    }

    @DeleteMapping("/session")
    public ResponseEntity<Map<String, String>> clearSession(
            @RequestHeader("X-User-Id") String userId) {
        assistantService.clearSession(UUID.fromString(userId));
        return ResponseEntity.ok(Map.of("message", "Session cleared"));
    }
}
