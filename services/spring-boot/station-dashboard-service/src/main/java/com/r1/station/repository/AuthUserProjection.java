package com.r1.station.repository;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;

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
