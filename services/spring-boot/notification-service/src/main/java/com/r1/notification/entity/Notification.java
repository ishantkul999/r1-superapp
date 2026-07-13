package com.r1.notification.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

/**
 * REPLACE the existing Notification.java entirely.
 *
 * DROP AT:
 *   services/spring-boot/notification-service/src/main/java/com/r1/notification/entity/Notification.java
 *
 * ROOT CAUSE of the error:
 *   ERROR: column "data" is of type jsonb but expression is of type character varying
 *
 * The original entity declared:
 *   @Column(columnDefinition = "jsonb") private String data;
 *
 * @Column(columnDefinition = "jsonb") only controls DDL generation (CREATE TABLE).
 * At runtime, Hibernate still binds a Java String as VARCHAR/TEXT.
 * PostgreSQL refuses to cast VARCHAR to JSONB implicitly → error.
 *
 * Fix: add @JdbcTypeCode(SqlTypes.JSON) which tells Hibernate to use the
 * JSON JDBC type binding, making it send the value with explicit ::jsonb casting.
 */
@Entity
@Table(name = "notifications", schema = "notif_svc")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String body;

    private String type;

    @Column(name = "is_read")
    @Builder.Default
    private Boolean isRead = false;

    // FIX: @JdbcTypeCode(SqlTypes.JSON) tells Hibernate to bind this as
    // JSON type, not VARCHAR — resolves "column data is of type jsonb but
    // expression is of type character varying" at INSERT time.
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String data;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
