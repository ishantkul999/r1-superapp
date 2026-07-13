package com.r1.station.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audit_logs", schema = "station_svc")
@Data
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String service;          // e.g. "porter-service"

    @Column(name = "actor_id")
    private String actorId;

    @Column(name = "actor_name")
    private String actorName;

    private String role;

    @Column(nullable = false)
    private String action;           // e.g. "BOOKING_CREATED"

    private String resource;         // e.g. "/api/porter/bookings"

    @Column(nullable = false)
    private String outcome;          // "SUCCESS" | "FAILURE"

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();
}
