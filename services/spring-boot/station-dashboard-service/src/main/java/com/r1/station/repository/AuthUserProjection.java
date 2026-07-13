package com.r1.station.repository;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;

/**
 * Lightweight read-only projection of auth_svc.users.
 * Used only so Spring Data has an @Entity to bind AuthUserRepo to.
 * It is NOT used for writes — all mutations go through the native @Modifying queries.
 *
 * DROP AT: services/spring-boot/station-dashboard-service/src/main/java/com/r1/station/repository/AuthUserProjection.java
 */
@Entity
@Table(name = "users", schema = "auth_svc")
@Data
public class AuthUserProjection {

    @Id
    private UUID id;

    private String phone;
    private String name;
    private String email;
    private String role;

    @Column(name = "is_active")
    private Boolean isActive;
}
