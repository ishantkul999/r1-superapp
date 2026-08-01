package com.r1.porter.repository;

import com.r1.porter.entity.PorterBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PorterBookingRepository extends JpaRepository<PorterBooking, UUID> {

    Optional<PorterBooking> findByBookingReference(String bookingReference);
    List<PorterBooking> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<PorterBooking> findByPorterIdOrderByCreatedAtDesc(UUID porterId);

    @Query("SELECT b FROM PorterBooking b WHERE b.porterId = :porterId AND b.status IN ('ACCEPTED','IN_PROGRESS')")
    List<PorterBooking> findActiveBookingsByPorter(UUID porterId);

    @Query("SELECT b FROM PorterBooking b WHERE b.status = 'PENDING_ACCEPTANCE' ORDER BY b.bookingTime ASC")
    List<PorterBooking> findPendingBookings();

    @Query("SELECT b FROM PorterBooking b WHERE b.porterId = :porterId AND b.status IN ('ACCEPTED','IN_PROGRESS') ORDER BY b.acceptanceTime DESC")
    List<PorterBooking> findActiveJobsByPorter(UUID porterId);

    @Query("SELECT b FROM PorterBooking b WHERE b.porterId = :porterId AND b.status = 'COMPLETED' AND b.completionTime >= :since ORDER BY b.completionTime DESC")
    List<PorterBooking> findCompletedByPorterSince(UUID porterId, Instant since);

    @Query("SELECT b FROM PorterBooking b WHERE b.status = 'PENDING_ACCEPTANCE' AND b.porterId IS NULL ORDER BY b.bookingTime ASC")
    List<PorterBooking> findUnassignedPendingBookings();

    @Query(value = """
        SELECT
            b.id, b.booking_reference, b.status, b.service_type,
            b.pickup_location, b.destination, b.passenger_name, b.passenger_mobile,
            b.total_amount, b.payment_method, b.acceptance_time, b.start_time,
            p.id AS porter_id, p.full_name AS porter_name, p.phone AS porter_phone,
            p.badge_number AS porter_badge
        FROM porter_svc.porter_bookings b
        JOIN porter_svc.porters p ON p.id = b.porter_id
        WHERE p.is_online = false AND b.status IN ('ACCEPTED','IN_PROGRESS')
        ORDER BY b.acceptance_time ASC
        """, nativeQuery = true)
    List<Object[]> findActiveBookingsForOfflinePortersRaw();

    @Query("SELECT COUNT(b) FROM PorterBooking b WHERE b.status = 'COMPLETED' AND b.completionTime >= :since")
    long countAllCompletedSince(Instant since);

    @Query(value = """
        SELECT
            b.id, b.booking_reference, b.user_id, b.porter_id,
            b.service_type, b.status,
            b.train_number, b.coach_number, b.platform,
            b.pnr_number, b.seat_berth,
            b.pickup_location, b.destination,
            b.passenger_name, b.passenger_mobile, b.passenger_email,
            b.special_instructions,
            b.base_amount, b.gst_amount, b.total_amount,
            b.payment_method, b.payment_id, b.service_pin,
            b.booking_time, b.acceptance_time, b.start_time, b.completion_time,
            b.station_id, b.created_at,
            p.full_name    AS porter_name,
            p.phone        AS porter_phone,
            p.badge_number AS porter_badge,
            p.zone         AS porter_zone
        FROM porter_svc.porter_bookings b
        LEFT JOIN porter_svc.porters p ON p.id = b.porter_id
        WHERE b.user_id = :userId
        ORDER BY b.created_at DESC
        """, nativeQuery = true)
    List<Object[]> findByUserIdWithPorterDetailsRaw(UUID userId);
}

