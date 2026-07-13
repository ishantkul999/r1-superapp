package com.r1.payment.kafka;

import com.r1.payment.entity.Payment;
import com.r1.payment.entity.Refund;
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
public class PaymentEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishOrderCreated(Payment payment) {
        send("payment.order_created", payment.getId().toString(), buildEvent("PAYMENT_ORDER_CREATED", payment));
    }

    public void publishPaymentSuccess(Payment payment) {
        Map<String, Object> event = buildEvent("PAYMENT_SUCCESS", payment);
        event.put("paymentId", payment.getId().toString());
        send("payment.success", payment.getId().toString(), event);
    }

    public void publishPaymentFailed(Payment payment) {
        send("payment.failed", payment.getId().toString(), buildEvent("PAYMENT_FAILED", payment));
    }

    public void publishRefundInitiated(Payment payment, Refund refund) {
        Map<String, Object> event = new HashMap<>();
        event.put("eventType", "PAYMENT_REFUND");
        event.put("paymentId", payment.getId().toString());
        event.put("refundId", refund.getId().toString());
        event.put("bookingId", payment.getBookingId().toString());
        event.put("bookingType", payment.getBookingType());
        event.put("amount", refund.getAmount());
        event.put("timestamp", Instant.now().toString());
        send("payment.refund", payment.getId().toString(), event);
    }

    private Map<String, Object> buildEvent(String eventType, Payment payment) {
        Map<String, Object> event = new HashMap<>();
        event.put("eventType", eventType);
        event.put("paymentId", payment.getId().toString());
        event.put("bookingId", payment.getBookingId().toString());
        event.put("bookingType", payment.getBookingType());
        event.put("userId", payment.getUserId().toString());
        event.put("amount", payment.getAmount());
        event.put("status", payment.getStatus());
        event.put("timestamp", Instant.now().toString());
        return event;
    }

    private void send(String topic, String key, Object payload) {
        kafkaTemplate.send(topic, key, payload)
                .whenComplete((result, ex) -> {
                    if (ex != null) log.error("Failed to publish to {}: {}", topic, ex.getMessage());
                    else log.debug("Published to {} key={}", topic, key);
                });
    }
}
