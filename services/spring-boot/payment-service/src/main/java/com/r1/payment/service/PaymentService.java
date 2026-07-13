package com.r1.payment.service;

import com.r1.payment.entity.Payment;
import com.r1.payment.entity.Refund;
import com.r1.payment.kafka.PaymentEventProducer;
import com.r1.payment.repository.PaymentRepository;
import com.r1.payment.repository.RefundRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final CashfreeClient cashfreeClient;
    private final PaymentEventProducer eventProducer;

    @Transactional
    public Map<String, Object> createOrder(UUID userId, UUID bookingId,
                                            String bookingType, BigDecimal amount,
                                            String phone, String name) {
        Map<String, Object> cfResponse = cashfreeClient.createOrder(
                bookingId, bookingType, amount.doubleValue(), phone, name);

        Payment payment = Payment.builder()
                .bookingId(bookingId)
                .bookingType(bookingType)
                .userId(userId)
                .cfOrderId((String) cfResponse.get("cfOrderId"))
                .amount(amount)
                .status("CREATED")
                .build();

        payment = paymentRepository.save(payment);
        eventProducer.publishOrderCreated(payment);

        return Map.of(
                "paymentId", payment.getId().toString(),
                "cfOrderId", payment.getCfOrderId(),
                "paymentSessionId", cfResponse.get("paymentSessionId"),
                "amount", amount
        );
    }

    @Transactional
    public void handleWebhook(String rawBody, String signature, String timestamp, Map<String, Object> payload) {
        if (!cashfreeClient.verifyWebhookSignature(rawBody, signature, timestamp)) {
            throw new RuntimeException("Invalid webhook signature");
        }

        String cfOrderId = (String) payload.get("order_id");
        String cfPaymentId = (String) payload.get("cf_payment_id");
        String cfStatus = (String) payload.get("payment_status");

        Payment payment = paymentRepository.findByCfOrderId(cfOrderId)
                .orElseThrow(() -> new RuntimeException("Payment not found for order: " + cfOrderId));

        payment.setCfPaymentId(cfPaymentId);
        payment.setWebhookVerified(true);
        payment.setUpdatedAt(Instant.now());

        if ("SUCCESS".equals(cfStatus)) {
            payment.setStatus("SUCCESS");
            paymentRepository.save(payment);
            eventProducer.publishPaymentSuccess(payment);
        } else if ("FAILED".equals(cfStatus)) {
            payment.setStatus("FAILED");
            paymentRepository.save(payment);
            eventProducer.publishPaymentFailed(payment);
        }
    }

    @Transactional
    public Refund initiateRefund(UUID paymentId, BigDecimal amount, String reason) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (!"SUCCESS".equals(payment.getStatus())) {
            throw new RuntimeException("Can only refund successful payments");
        }

        Map<String, Object> cfRefund = cashfreeClient.initiateRefund(
                payment.getCfOrderId(), amount.doubleValue(), reason);

        Refund refund = Refund.builder()
                .paymentId(paymentId)
                .cfRefundId((String) cfRefund.get("cfRefundId"))
                .amount(amount)
                .reason(reason)
                .status("INITIATED")
                .build();

        refund = refundRepository.save(refund);
        eventProducer.publishRefundInitiated(payment, refund);
        return refund;
    }
}
