package com.r1.payment.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "refunds", schema = "payment_svc")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Refund {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "payment_id", nullable = false)
    private UUID paymentId;

    @Column(name = "cf_refund_id")
    private String cfRefundId;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private String reason;

    @Column(nullable = false)
    private String status;

    @Column(name = "initiated_at") @Builder.Default
    private Instant initiatedAt = Instant.now();

    @Column(name = "processed_at")
    private Instant processedAt;
}
