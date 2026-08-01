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

@Slf4j
@Component
@RequiredArgsConstructor
public class SupervisorAssignmentScheduler {

    private final PorterBookingRepository       bookingRepository;
    private final StringRedisTemplate           redisTemplate;
    private final KafkaTemplate<String, Object> kafkaTemplate;   // NEW

    private static final String SUPERVISOR_TIMER_KEY = "porter:supervisor_timer:%s";
    private static final String ESCALATED_KEY = "porter:escalated:%s";

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

                redisTemplate.convertAndSend("supervisor:escalations", booking.getId().toString());

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
            log.warn("Could not publish escalation Kafka event: {}", e.getMessage());
        }
    }
}
