package com.r1.notification.service;

import com.r1.notification.entity.Notification;
import com.r1.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final FcmStubService fcmService;

    @Transactional
    public Notification send(UUID userId, String title, String body, String type, String data) {
        Notification notif = Notification.builder()
                .userId(userId)
                .title(title)
                .body(body)
                .type(type)
                .data(data)
                .build();
        notif = notificationRepository.save(notif);

        // FCM push (best effort)
        fcmService.sendPush(userId.toString(), title, body);
        return notif;
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

    // ─── Kafka Listeners ─────────────────────────────────────────────

    @KafkaListener(topics = "porter.booked", groupId = "notification-service")
    public void onPorterBooked(Map<String, Object> event) {
        try {
            String userId = (String) event.get("userId");
            String bookingRef = (String) event.get("bookingReference");
            String serviceType = (String) event.get("serviceType");
            send(UUID.fromString(userId),
                    "Porter Booking Confirmed!",
                    "Your " + serviceType + " booking " + bookingRef + " has been received. Finding a porter...",
                    "PORTER_BOOKED", null);
        } catch (Exception e) {
            log.error("Error handling porter.booked: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "porter.assigned", groupId = "notification-service")
    public void onPorterAssigned(Map<String, Object> event) {
        try {
            String userId = (String) event.get("userId");
            String bookingRef = (String) event.get("bookingReference");
            send(UUID.fromString(userId),
                    "Porter Assigned!",
                    "A porter has been assigned to your booking " + bookingRef + ". They are on their way!",
                    "PORTER_ASSIGNED", null);
        } catch (Exception e) {
            log.error("Error handling porter.assigned: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "porter.completed", groupId = "notification-service")
    public void onPorterCompleted(Map<String, Object> event) {
        try {
            String userId = (String) event.get("userId");
            String bookingRef = (String) event.get("bookingReference");
            send(UUID.fromString(userId),
                    "Service Completed!",
                    "Your porter service " + bookingRef + " has been completed. Please rate your experience.",
                    "PORTER_COMPLETED", null);
        } catch (Exception e) {
            log.error("Error handling porter.completed: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "payment.success", groupId = "notification-service")
    public void onPaymentSuccess(Map<String, Object> event) {
        try {
            String userId = (String) event.get("userId");
            Object amount = event.get("amount");
            send(UUID.fromString(userId),
                    "Payment Successful",
                    "Payment of ₹" + amount + " received successfully.",
                    "PAYMENT_SUCCESS", null);
        } catch (Exception e) {
            log.error("Error handling payment.success: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "payment.failed", groupId = "notification-service")
    public void onPaymentFailed(Map<String, Object> event) {
        try {
            String userId = (String) event.get("userId");
            send(UUID.fromString(userId),
                    "Payment Failed",
                    "Your payment could not be processed. Please try again.",
                    "PAYMENT_FAILED", null);
        } catch (Exception e) {
            log.error("Error handling payment.failed: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "sos.triggered", groupId = "notification-service")
    public void onSosTriggered(Map<String, Object> event) {
        try {
            String userId = (String) event.get("userId");
            send(UUID.fromString(userId),
                    "SOS Alert Sent!",
                    "Your SOS has been received. RPF is on the way. Stay calm.",
                    "SOS_TRIGGERED", null);
        } catch (Exception e) {
            log.error("Error handling sos.triggered: {}", e.getMessage());
        }
    }
}
