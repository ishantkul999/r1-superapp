package com.r1.notification.controller;

import com.r1.notification.entity.Notification;
import com.r1.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REPLACE the existing NotificationController.java.
 *
 * DROP AT:
 *   services/spring-boot/notification-service/src/main/java/com/r1/notification/controller/NotificationController.java
 *
 * ENDPOINTS:
 *   GET  /api/notifications                → List<Notification> plain array — Topbar calls this
 *   GET  /api/notifications/unread-count   → { "count": N }
 *   PUT  /api/notifications/{id}/read      → mark single notification read
 *   PUT  /api/notifications/mark-all-read  → mark all read for this user (bulk)
 *   POST /api/notifications/internal/send  → internal endpoint (other services call this)
 *
 * IMPORTANT:
 *   Returns plain List<Notification> (not wrapped in an object).
 *   Frontend does: setNotifs(Array.isArray(r.data) ? r.data : [])
 *   Response shape per notification: { id, userId, title, body, type, isRead, createdAt }
 *   Field names are camelCase (Jackson default) — not snake_case.
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // ── GET /api/notifications ────────────────────────────────────────────────
    // Returns plain JSON array. X-User-Id injected by JwtAuthFilter in gateway.
    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(notificationService.getForUser(UUID.fromString(userId)));
    }

    // ── GET /api/notifications/unread-count ───────────────────────────────────
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(
            @RequestHeader("X-User-Id") String userId) {
        long count = notificationService.getUnreadCount(UUID.fromString(userId));
        return ResponseEntity.ok(Map.of("count", count));
    }

    // ── PUT /api/notifications/mark-all-read ──────────────────────────────────
    // MUST be declared BEFORE /{notifId}/read to avoid Spring matching
    // "mark-all-read" as a UUID path variable and throwing 400.
    @PutMapping("/mark-all-read")
    public ResponseEntity<Map<String, Integer>> markAllRead(
            @RequestHeader("X-User-Id") String userId) {
        int count = notificationService.markAllReadForUser(UUID.fromString(userId));
        return ResponseEntity.ok(Map.of("marked", count));
    }

    // ── PUT /api/notifications/{notifId}/read ─────────────────────────────────
    @PutMapping("/{notifId}/read")
    public ResponseEntity<Void> markRead(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable UUID notifId) {
        notificationService.markRead(notifId);
        return ResponseEntity.ok().build();
    }

    // ── POST /api/notifications/internal/send ────────────────────────────────
    // Called by porter-service, sos-service, payment-service via internal HTTP
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
