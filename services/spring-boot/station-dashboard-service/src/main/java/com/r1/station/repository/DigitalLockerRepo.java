package com.r1.station.repository;

import com.r1.station.entity.DigitalLocker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface DigitalLockerRepo extends JpaRepository<DigitalLocker, UUID> {
    List<DigitalLocker> findByStationIdAndIsActiveTrue(UUID stationId);
    List<DigitalLocker> findByStationIdAndSizeAndIsActiveTrue(UUID stationId, String size);
}
