package com.r1.porter.repository;

import com.r1.porter.entity.Porter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * REPLACE the existing PorterRepository.java entirely.
 *
 * DROP AT:
 *   services/spring-boot/porter-service/src/main/java/com/r1/porter/repository/PorterRepository.java
 */
@Repository
public interface PorterRepository extends JpaRepository<Porter, UUID> {

    // ── Existing (keep unchanged) ─────────────────────────────────────────────

    Optional<Porter> findByUserId(UUID userId);

    List<Porter> findByIsOnlineTrueAndIsActiveTrue();

    List<Porter> findByIsActiveTrueAndStationId(UUID stationId);

    boolean existsByUserId(UUID userId);

    boolean existsByBadgeNumber(String badgeNumber);

    // ── NEW ───────────────────────────────────────────────────────────────────

    /** Full directory for supervisor / station-control */
    List<Porter> findByIsActiveTrue();

    long countByIsActiveTrueAndIsOnlineTrue();

    long countByIsActiveTrue();

    /** Online count for supervisor dashboard */
    @Query("SELECT COUNT(p) FROM Porter p WHERE p.isActive = true AND p.isOnline = true")
    long countOnlineActive();

    /** Total active porter count */
    @Query("SELECT COUNT(p) FROM Porter p WHERE p.isActive = true")
    long countActive();
}

