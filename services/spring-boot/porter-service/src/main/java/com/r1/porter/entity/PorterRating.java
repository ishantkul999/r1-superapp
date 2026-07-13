package com.r1.porter.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "porter_ratings", schema = "porter_svc")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PorterRating {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "booking_id", unique = true, nullable = false)
    private UUID bookingId;

    @Column(name = "porter_id", nullable = false)
    private UUID porterId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private Integer rating;

    private String comment;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
