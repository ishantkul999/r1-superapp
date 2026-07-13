package com.r1.station.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Native-query repository that reads auth_svc.users from station-dashboard-service.
 * The datasource DB user must have SELECT/UPDATE on auth_svc schema.
 *
 * Uses Spring Data's base Repository (no entity class needed) + native SQL.
 * DROP AT: services/spring-boot/station-dashboard-service/src/main/java/com/r1/station/repository/AuthUserRepo.java
 */
@Component
public interface AuthUserRepo extends Repository<AuthUserProjection, UUID> {

    @Query(value = "SELECT COUNT(*) FROM auth_svc.users WHERE is_active = true",
            nativeQuery = true)
    long countByIsActiveTrue();

    @Query(value = "SELECT COUNT(*) FROM auth_svc.users WHERE role = :role AND is_active = true",
            nativeQuery = true)
    long countByRoleAndIsActiveTrue(String role);

    /**
     * Returns rows: [id, phone, name, email, role, created_at, is_active]
     */
    @Query(value = "SELECT id, phone, name, email, role, created_at, is_active " +
            "FROM auth_svc.users ORDER BY created_at DESC",
            nativeQuery = true)
    List<Object[]> findAllUserRows(Pageable pageable);

    @Query(value = "SELECT id, phone, name, email, role, created_at, is_active " +
            "FROM auth_svc.users WHERE role = :role ORDER BY created_at DESC",
            nativeQuery = true)
    List<Object[]> findUserRowsByRole(String role, Pageable pageable);

    @Modifying
    @Query(value = "UPDATE auth_svc.users SET is_active = :active WHERE id = :userId",
            nativeQuery = true)
    void setUserActive(UUID userId, boolean active);
}
