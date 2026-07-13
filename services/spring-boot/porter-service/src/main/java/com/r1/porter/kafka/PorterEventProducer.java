package com.r1.porter.kafka;

import com.r1.porter.entity.PorterBooking;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class PorterEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishBookingCreated(PorterBooking booking) {
        Map<String, Object> event = buildBookingEvent("PORTER_BOOKING_CREATED", booking);
        send("porter.booked", booking.getId().toString(), event);
    }

    public void publishBookingAssigned(PorterBooking booking) {
        Map<String, Object> event = buildBookingEvent("PORTER_BOOKING_ASSIGNED", booking);
        send("porter.assigned", booking.getId().toString(), event);
    }

    public void publishBookingCompleted(PorterBooking booking) {
        Map<String, Object> event = buildBookingEvent("PORTER_BOOKING_COMPLETED", booking);
        send("porter.completed", booking.getId().toString(), event);
    }

    private Map<String, Object> buildBookingEvent(String eventType, PorterBooking booking) {
        Map<String, Object> event = new HashMap<>();
        event.put("eventType", eventType);
        event.put("bookingId", booking.getId().toString());
        event.put("bookingReference", booking.getBookingReference());
        event.put("userId", booking.getUserId().toString());
        event.put("porterId", booking.getPorterId() != null ? booking.getPorterId().toString() : null);
        event.put("status", booking.getStatus());
        event.put("serviceType", booking.getServiceType());
        event.put("totalAmount", booking.getTotalAmount());
        event.put("paymentMethod", booking.getPaymentMethod());
        event.put("platform", booking.getPlatform());
        event.put("timestamp", Instant.now().toString());
        return event;
    }

    private void send(String topic, String key, Object payload) {
        kafkaTemplate.send(topic, key, payload)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish to {}: {}", topic, ex.getMessage());
                    } else {
                        log.debug("Published to {} key={}", topic, key);
                    }
                });
    }
}
