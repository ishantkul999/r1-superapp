package com.r1.station.repository;

import com.r1.station.entity.Facility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface FacilityRepo extends JpaRepository<Facility, UUID> {
    List<Facility> findByStationId(UUID stationId);
    List<Facility> findByStationIdAndType(UUID stationId, String type);
}
