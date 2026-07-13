package com.r1.porter.kafka;

import com.r1.porter.service.PorterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class PorterEventConsumer {

    private final PorterService porterService;

    @KafkaListener(topics = "payment.success", groupId = "porter-service")
    public void onPaymentSuccess(Map<String, Object> event) {
        try {
            String bookingType = (String) event.get("bookingType");
            if (!"PORTER".equals(bookingType)) return;

            String bookingId = (String) event.get("bookingId");
            String paymentId = (String) event.get("paymentId");

            log.info("Processing payment.success for porter booking {}", bookingId);
            porterService.onPaymentSuccess(UUID.fromString(bookingId), UUID.fromString(paymentId));
        } catch (Exception e) {
            log.error("Error processing payment.success event: {}", e.getMessage(), e);
        }
    }
}
