package com.r1.payment.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payments", schema = "payment_svc")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Payment {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "booking_id", nullable = false)
    private UUID bookingId;

    @Column(name = "booking_type", nullable = false)
    private String bookingType;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "cf_order_id", unique = true, nullable = false)
    private String cfOrderId;

    @Column(name = "cf_payment_id")
    private String cfPaymentId;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(length = 3) @Builder.Default
    private String currency = "INR";

    @Column(nullable = false)
    private String status;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "webhook_verified") @Builder.Default
    private Boolean webhookVerified = false;

    @Column(name = "created_at") @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at") @Builder.Default
    private Instant updatedAt = Instant.now();
}
