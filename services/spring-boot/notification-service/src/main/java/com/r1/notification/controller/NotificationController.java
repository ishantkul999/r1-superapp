package com.r1.notification.controller;

import com.r1.notification.entity.Notification;
import com.r1.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(notificationService.getForUser(UUID.fromString(userId)));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(
            @RequestHeader("X-User-Id") String userId) {
        long count = notificationService.getUnreadCount(UUID.fromString(userId));
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<Map<String, Integer>> markAllRead(
            @RequestHeader("X-User-Id") String userId) {
        int count = notificationService.markAllReadForUser(UUID.fromString(userId));
        return ResponseEntity.ok(Map.of("marked", count));
    }

    @PutMapping("/{notifId}/read")
    public ResponseEntity<Void> markRead(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable UUID notifId) {
        notificationService.markRead(notifId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/internal/send")
    public ResponseEntity<Notification> sendInternal(
            @RequestHeader("X-Internal-Secret") String secret,
            @RequestBody Map<String, String> body) {
        Notification n = notificationService.send(
                UUID.fromString(body.get("userId")),
                body.get("title"),
                body.get("body"),
                body.get("type"),
                body.get("data")
        );
        return ResponseEntity.ok(n);
    }
}
