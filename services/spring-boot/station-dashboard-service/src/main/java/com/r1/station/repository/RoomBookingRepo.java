package com.r1.station.repository;

import com.r1.station.entity.RoomBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomBookingRepo extends JpaRepository<RoomBooking, UUID> {
    List<RoomBooking> findByUserId(UUID userId);
    Optional<RoomBooking> findByBookingReference(String ref);

    @Query("SELECT b FROM RoomBooking b WHERE b.roomId = :roomId " +
           "AND b.status IN ('CONFIRMED','CHECKED_IN') " +
           "AND NOT (b.checkOut <= :checkIn OR b.checkIn >= :checkOut)")
    List<RoomBooking> findConflictingBookings(UUID roomId, LocalDate checkIn, LocalDate checkOut);
}
