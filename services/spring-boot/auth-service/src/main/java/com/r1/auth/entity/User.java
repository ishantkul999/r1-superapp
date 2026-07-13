package com.r1.auth.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users", schema = "auth_svc")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false, length = 15)
    private String phone;

    @Column(length = 100)
    private String name;

    @Column(length = 255)
    private String email;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String role = "USER";

    @Column(name = "google_sub", length = 255)
    private String googleSub;

    @Column(name = "google_email", length = 255)
    private String googleEmail;

    @Column(name = "station_id")
    private UUID stationId;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
