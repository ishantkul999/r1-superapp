package com.r1.porter.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

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

    @Column(name = "employee_id")
    private String employeeId;

    @Column(name = "full_name")
    private String fullName;

    private String email;

    private String phone;

    @Column(name = "date_of_birth")
    private java.time.LocalDate dateOfBirth;

    @Column(name = "onboarded_by")
    private UUID onboardedBy;

    @Column(name = "onboarded_at")
    @Builder.Default
    private Instant onboardedAt = Instant.now();

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
