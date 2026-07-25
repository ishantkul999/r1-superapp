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
 * ROOT CAUSE of notification insert failures:
 *   @Column(columnDefinition = "jsonb") on the `data` field only controls DDL.
 *   At runtime Hibernate binds a Java String as VARCHAR → PostgreSQL refuses
 *   the implicit cast to JSONB → INSERT fails with:
 *   "column data is of type jsonb but expression is of type character varying"
 *
 * FIX: Add @JdbcTypeCode(SqlTypes.JSON) which tells Hibernate to use the JSON
 *   JDBC type binding, sending the value with explicit jsonb casting.
 *
 * FIELD NAMES (important for frontend):
 *   Jackson serialises these as camelCase by default:
 *   isRead    → frontend must use n.isRead    (NOT n.is_read)
 *   createdAt → frontend must use n.createdAt (NOT n.created_at)
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

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    private String type;

    @Column(name = "is_read")
    @Builder.Default
    private Boolean isRead = false;

    /**
     * FIX: @JdbcTypeCode(SqlTypes.JSON) is required.
     * Without it, Hibernate sends this String as VARCHAR → JSONB cast error.
     * With it, Hibernate sends it as JSON type → PostgreSQL accepts it.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String data;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
