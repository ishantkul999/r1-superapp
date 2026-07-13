package com.r1.porter.scheduler;

import com.r1.porter.entity.PorterBooking;
import com.r1.porter.repository.PorterBookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REPLACE the existing SupervisorAssignmentScheduler.java.
 *
 * DROP AT:
 *   services/spring-boot/porter-service/src/main/java/com/r1/porter/scheduler/SupervisorAssignmentScheduler.java
 *
 * CHANGE FROM ORIGINAL:
 *   In addition to the existing Redis pub/sub publish (kept unchanged for
 *   backward compat), this now ALSO publishes to Kafka topic
 *   "supervisor.escalation". The sos-service Kafka bridge consumer picks
 *   this up and pushes a real-time Socket.io event to the 'supervisor-room',
 *   so supervisors see escalated (unaccepted) bookings the instant the
 *   15-second timer expires — without polling.
 *
 * This directly implements:
 *   "if porter wont accept within 15sec supervisor would assign a offline
 *    porter (having no digital device)"
 *   — the supervisor now gets an INSTANT push notification the moment a
 *   booking needs manual/offline assignment, instead of waiting for the
 *   dashboard's next poll cycle.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SupervisorAssignmentScheduler {

    private final PorterBookingRepository       bookingRepository;
    private final StringRedisTemplate           redisTemplate;
    private final KafkaTemplate<String, Object> kafkaTemplate;   // NEW

    private static final String SUPERVISOR_TIMER_KEY = "porter:supervisor_timer:%s";
    private static final String ESCALATED_KEY = "porter:escalated:%s";

    /**
     * Every 5 seconds, check pending bookings whose 15s timer has expired.
     * Escalate them for supervisor manual assignment.
     */
    @Scheduled(fixedDelay = 5000)
    public void checkSupervisorEscalations() {
        List<PorterBooking> pendingBookings = bookingRepository.findPendingBookings();

        for (PorterBooking booking : pendingBookings) {
            String timerKey = String.format(SUPERVISOR_TIMER_KEY, booking.getId());
            String escalatedKey = String.format(ESCALATED_KEY, booking.getId());

            boolean timerExpired = !Boolean.TRUE.equals(redisTemplate.hasKey(timerKey));
            boolean alreadyEscalated = Boolean.TRUE.equals(redisTemplate.hasKey(escalatedKey));

            if (timerExpired && !alreadyEscalated) {
                log.info("Booking {} escalated to supervisor — no porter accepted within 15s",
                        booking.getBookingReference());

                redisTemplate.opsForValue().set(escalatedKey, "1", java.time.Duration.ofHours(1));

                // EXISTING — kept unchanged for any code already listening on this channel
                redisTemplate.convertAndSend("supervisor:escalations", booking.getId().toString());

                // NEW — publish to Kafka so sos-service's Socket.io bridge can push
                // a real-time event to the 'supervisor-room', giving supervisors
                // instant visibility (instead of relying on dashboard polling).
                publishEscalationEvent(booking);
            }
        }
    }

    private void publishEscalationEvent(PorterBooking booking) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("bookingId", booking.getId().toString());
            event.put("bookingReference", booking.getBookingReference());
            event.put("userId", booking.getUserId().toString());
            event.put("serviceType", booking.getServiceType());
            event.put("platform", booking.getPlatform());
            event.put("pickupLocation", booking.getPickupLocation());
            event.put("passengerName", booking.getPassengerName());
            event.put("passengerMobile", booking.getPassengerMobile());
            event.put("totalAmount", booking.getTotalAmount());
            event.put("paymentMethod", booking.getPaymentMethod());
            event.put("timestamp", Instant.now().toString());

            kafkaTemplate.send("supervisor.escalation", booking.getId().toString(), event)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.warn("Failed to publish supervisor.escalation for booking {}: {}",
                                    booking.getId(), ex.getMessage());
                        }
                    });
        } catch (Exception e) {
            // Non-fatal — Redis pub/sub above still works even if Kafka publish fails
            log.warn("Could not publish escalation Kafka event: {}", e.getMessage());
        }
    }
}
