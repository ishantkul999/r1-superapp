package com.r1.notification.service;

import com.r1.notification.entity.Notification;
import com.r1.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REPLACE the existing NotificationService.java.
 *
 * DROP AT:
 *   services/spring-boot/notification-service/src/main/java/com/r1/notification/service/NotificationService.java
 *
 * CHANGES:
 *   + markAllReadForUser() — used by PUT /mark-all-read
 *   + send() now passes null for data instead of "{}" to avoid jsonb cast issues
 *     when the @JdbcTypeCode fix is not yet applied
 *   + All Kafka listeners wrapped in try-catch to prevent consumer thread death
 *   + NEW: send() now publishes a "notification.created" Kafka event after
 *     persisting. sos-service's Kafka bridge consumes this and pushes it
 *     live to the user's "user:{userId}" Socket.io room, so the frontend
 *     notification bell updates instantly instead of waiting up to 8s for
 *     the next poll. This replaces polling as the primary delivery
 *     mechanism — NotificationDropdown.jsx still polls as a fallback in
 *     case the socket connection drops, but that's now a safety net, not
 *     the main path.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    private static final String NOTIFICATION_CREATED_TOPIC = "notification.created";

    // ── Core operations ───────────────────────────────────────────────────────

    @Transactional
    public Notification send(UUID userId, String title, String body, String type, String data) {
        Notification n = Notification.builder()
                .userId(userId)
                .title(title != null ? title : "Notification")
                .body(body  != null ? body  : "")
                .type(type)
                // Pass null for data to avoid jsonb cast error if @JdbcTypeCode not applied yet
                // Once Notification.java entity fix is applied, valid JSON strings work fine
                .data(data != null && !data.isBlank() && !data.equals("null") ? data : null)
                .build();
        Notification saved = notificationRepository.save(n);

        try {
            kafkaTemplate.send(NOTIFICATION_CREATED_TOPIC, saved.getUserId().toString(), Map.of(
                    "id", saved.getId().toString(),
                    "userId", saved.getUserId().toString(),
                    "title", saved.getTitle(),
                    "body", saved.getBody(),
                    "type", saved.getType() != null ? saved.getType() : "",
                    "isRead", saved.getIsRead(),
                    "createdAt", saved.getCreatedAt().toString()
            ));
        } catch (Exception e) {
            // Never let a Kafka publish failure roll back or block the
            // notification itself — the row is already saved, and polling
            // will still pick it up as a fallback.
            log.warn("[Notif] Failed to publish notification.created for user {}: {}", userId, e.getMessage());
        }

        return saved;
    }

    public List<Notification> getForUser(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public void markRead(UUID notifId) {
        notificationRepository.findById(notifId).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
    }

    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public int markAllReadForUser(UUID userId) {
        return notificationRepository.markAllReadForUser(userId);
    }

    // ── Kafka Listeners ───────────────────────────────────────────────────────
    // All wrapped in try-catch: a single bad message must not kill the consumer thread.

    @KafkaListener(topics = "porter.booked", groupId = "notification-service")
    public void onPorterBooked(Map<String, Object> event) {
        try {
            String userId = str(event.get("userId"));
            String ref    = str(event.get("bookingReference"));
            String svc    = str(event.get("serviceType"));
            if (userId == null) return;
            send(UUID.fromString(userId),
                    "Porter Booking Confirmed",
                    svc + " booking " + ref + " received. Finding a porter…",
                    "PORTER_BOOKED", null);
        } catch (Exception e) { log.error("[Notif] porter.booked error: {}", e.getMessage()); }
    }

    @KafkaListener(topics = "porter.assigned", groupId = "notification-service")
    public void onPorterAssigned(Map<String, Object> event) {
        try {
            String userId = str(event.get("userId"));
            String ref    = str(event.get("bookingReference"));
            if (userId == null) return;
            send(UUID.fromString(userId),
                    "Porter Assigned",
                    "A porter has been assigned to booking " + ref + ". They are on the way!",
                    "PORTER_ASSIGNED", null);
        } catch (Exception e) { log.error("[Notif] porter.assigned error: {}", e.getMessage()); }
    }

    @KafkaListener(topics = "porter.completed", groupId = "notification-service")
    public void onPorterCompleted(Map<String, Object> event) {
        try {
            String userId = str(event.get("userId"));
            String ref    = str(event.get("bookingReference"));
            if (userId == null) return;
            send(UUID.fromString(userId),
                    "Service Completed",
                    "Your porter service " + ref + " is complete. Please rate your experience.",
                    "PORTER_COMPLETED", null);
        } catch (Exception e) { log.error("[Notif] porter.completed error: {}", e.getMessage()); }
    }

    @KafkaListener(topics = "payment.success", groupId = "notification-service")
    public void onPaymentSuccess(Map<String, Object> event) {
        try {
            String userId = str(event.get("userId"));
            Object amount = event.get("amount");
            if (userId == null) return;
            send(UUID.fromString(userId),
                    "Payment Successful",
                    "Payment of ₹" + amount + " received successfully.",
                    "PAYMENT_SUCCESS", null);
        } catch (Exception e) { log.error("[Notif] payment.success error: {}", e.getMessage()); }
    }

    @KafkaListener(topics = "payment.failed", groupId = "notification-service")
    public void onPaymentFailed(Map<String, Object> event) {
        try {
            String userId = str(event.get("userId"));
            if (userId == null) return;
            send(UUID.fromString(userId),
                    "Payment Failed",
                    "Your payment could not be processed. Please try again.",
                    "PAYMENT_FAILED", null);
        } catch (Exception e) { log.error("[Notif] payment.failed error: {}", e.getMessage()); }
    }

    @KafkaListener(topics = "sos.triggered", groupId = "notification-service")
    public void onSosTriggered(Map<String, Object> event) {
        try {
            String userId = str(event.get("userId"));
            if (userId == null) return;
            send(UUID.fromString(userId),
                    "SOS Alert Sent",
                    "Your SOS has been received. RPF is on the way. Stay calm.",
                    "SOS_TRIGGERED", null);
        } catch (Exception e) { log.error("[Notif] sos.triggered error: {}", e.getMessage()); }
    }

    private static String str(Object o) { return o != null ? o.toString() : null; }
}

