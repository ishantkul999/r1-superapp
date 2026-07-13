package com.r1.station.repository;

import com.r1.station.entity.LockerBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LockerBookingRepo extends JpaRepository<LockerBooking, UUID> {
    List<LockerBooking> findByUserId(UUID userId);
    Optional<LockerBooking> findByBookingReference(String ref);

    @Query("SELECT b FROM LockerBooking b WHERE b.lockerId = :lockerId " +
           "AND b.status IN ('CONFIRMED','ACTIVE') " +
           "AND NOT (b.endTime <= :startTime OR b.startTime >= :endTime)")
    List<LockerBooking> findConflictingLockerBookings(UUID lockerId, Instant startTime, Instant endTime);
}
