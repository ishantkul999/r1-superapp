package com.r1.station.repository;

import com.r1.station.entity.StationRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface StationRoomRepo extends JpaRepository<StationRoom, UUID> {
    List<StationRoom> findByStationIdAndIsActiveTrue(UUID stationId);
    List<StationRoom> findByStationIdAndRoomTypeAndIsActiveTrue(UUID stationId, String roomType);
}
