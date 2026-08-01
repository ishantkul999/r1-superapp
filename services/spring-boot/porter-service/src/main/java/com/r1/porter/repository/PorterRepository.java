package com.r1.porter.repository;

import com.r1.porter.entity.Porter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;


@Repository
public interface PorterRepository extends JpaRepository<Porter, UUID> {



    Optional<Porter> findByUserId(UUID userId);

    List<Porter> findByIsOnlineTrueAndIsActiveTrue();

    List<Porter> findByIsOnlineFalseAndIsActiveTrue();

    List<Porter> findByIsActiveTrueAndStationId(UUID stationId);

    boolean existsByUserId(UUID userId);

    boolean existsByBadgeNumber(String badgeNumber);

    List<Porter> findByIsActiveTrue();

    long countByIsActiveTrueAndIsOnlineTrue();

    long countByIsActiveTrue();

    @Query("SELECT COUNT(p) FROM Porter p WHERE p.isActive = true AND p.isOnline = true")
    long countOnlineActive();

    @Query("SELECT COUNT(p) FROM Porter p WHERE p.isActive = true")
    long countActive();
}
