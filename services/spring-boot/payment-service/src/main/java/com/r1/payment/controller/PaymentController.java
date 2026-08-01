package com.r1.payment.controller;

import com.r1.payment.entity.Refund;
import com.r1.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/orders")
    public ResponseEntity<Map<String, Object>> createOrder(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Phone") String phone,
            @RequestBody Map<String, Object> body) {

        UUID bookingId = UUID.fromString((String) body.get("bookingId"));
        String bookingType = (String) body.get("bookingType");
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        String name = (String) body.getOrDefault("name", "R1 User");

        Map<String, Object> result = paymentService.createOrder(
                UUID.fromString(userId), bookingId, bookingType, amount, phone, name);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/webhook/cashfree")
    public ResponseEntity<String> handleWebhook(
            @RequestHeader(value = "x-webhook-signature", required = false) String signature,
            @RequestHeader(value = "x-webhook-timestamp", required = false) String timestamp,
            @RequestBody String rawBody,
            @RequestBody(required = false) Map<String, Object> payload) {

        paymentService.handleWebhook(rawBody, signature, timestamp, Map.of());
        return ResponseEntity.ok("OK");
    }

    @PostMapping("/{paymentId}/refund")
    public ResponseEntity<Refund> initiateRefund(
            @PathVariable UUID paymentId,
            @RequestHeader("X-User-Role") String role,
            @RequestBody Map<String, Object> body) {

        if (!java.util.List.of("STATION_CONTROL_ROOM", "SUPERADMIN").contains(role)) {
            return ResponseEntity.status(403).build();
        }

        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        String reason = (String) body.get("reason");
        return ResponseEntity.ok(paymentService.initiateRefund(paymentId, amount, reason));
    }
}
