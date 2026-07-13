package com.r1.porter.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * REPLACE the existing Porter.java entirely.
 *
 * DROP AT:
 *   services/spring-boot/porter-service/src/main/java/com/r1/porter/entity/Porter.java
 *
 * Changes from original:
 *   + employeeId     — railway employee ID (set by Station Control Room at onboarding)
 *   + fullName       — porter's legal name (from onboarding form)
 *   + email          — porter's email (from onboarding form)
 *   + phone          — porter's mobile (from onboarding form)
 *   + dateOfBirth    — porter's DOB
 *   + onboardedBy    — UUID of the Station Control Room user who created this
 *   + onboardedAt    — when the porter was registered
 *
 * These fields populate the Porter's Profile page (read-only — set by Station Control).
 * Original fields (badgeNumber, licenseId, serviceType, zone, platforms, etc.) unchanged.
 */
@Entity
@Table(name = "porters", schema = "porter_svc")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Porter {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", unique = true, nullable = false)
    private UUID userId;

    @Column(name = "badge_number", unique = true, nullable = false)
    private String badgeNumber;

    @Column(name = "license_id")
    private String licenseId;

    @Column(name = "service_type", nullable = false)
    private String serviceType;

    private String zone;

    private String[] platforms;

    @Column(name = "is_online")
    @Builder.Default
    private Boolean isOnline = false;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "avg_rating")
    @Builder.Default
    private BigDecimal avgRating = new BigDecimal("5.00");

    @Column(name = "total_services")
    @Builder.Default
    private Integer totalServices = 0;

    @Column(name = "station_id")
    private UUID stationId;

    // ── NEW: Profile fields set by Station Control Room at onboarding ─────────

    /** Railway employee ID assigned by the station */
    @Column(name = "employee_id")
    private String employeeId;

    /** Porter's legal full name */
    @Column(name = "full_name")
    private String fullName;

    /** Porter's official email */
    private String email;

    /** Porter's registered mobile (same as auth_svc.users.phone) */
    private String phone;

    /** Porter's date of birth */
    @Column(name = "date_of_birth")
    private java.time.LocalDate dateOfBirth;

    /** UUID of Station Control Room user who onboarded this porter */
    @Column(name = "onboarded_by")
    private UUID onboardedBy;

    @Column(name = "onboarded_at")
    @Builder.Default
    private Instant onboardedAt = Instant.now();

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
