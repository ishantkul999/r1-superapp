package com.r1.payment.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
public class CashfreeClient {

    @Value("${cashfree.app-id:stub}")
    private String appId;

    @Value("${cashfree.secret:stub}")
    private String secret;

    @Value("${cashfree.env:TEST}")
    private String env;

    public Map<String, Object> createOrder(UUID bookingId, String bookingType,
                                            double amount, String phone, String name) {
        if ("stub".equals(appId)) {
            String stubOrderId = "cf_stub_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
            String stubPaymentSessionId = "session_stub_" + UUID.randomUUID().toString().replace("-", "");
            log.info("STUB: Created Cashfree order {} for booking {}", stubOrderId, bookingId);
            return Map.of(
                    "cfOrderId", stubOrderId,
                    "paymentSessionId", stubPaymentSessionId,
                    "status", "ACTIVE",
                    "env", "STUB"
            );
        }

        // Real Cashfree API call (implement when key is available)
        // POST https://sandbox.cashfree.com/pg/orders
        log.info("Creating Cashfree order for booking {}", bookingId);
        throw new UnsupportedOperationException("Real Cashfree integration not yet configured");
    }

    public boolean verifyWebhookSignature(String rawBody, String signature, String timestamp) {
        if ("stub".equals(appId)) {
            log.info("STUB: Webhook signature verification skipped");
            return true;
        }
        // HMAC-SHA256 verification logic here
        return false;
    }

    public Map<String, Object> initiateRefund(String cfOrderId, double amount, String reason) {
        if ("stub".equals(appId)) {
            String stubRefundId = "refund_stub_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            log.info("STUB: Initiated refund {} for order {}", stubRefundId, cfOrderId);
            return Map.of(
                    "cfRefundId", stubRefundId,
                    "status", "SUCCESS",
                    "amount", amount
            );
        }
        throw new UnsupportedOperationException("Real Cashfree refund not yet configured");
    }
}
