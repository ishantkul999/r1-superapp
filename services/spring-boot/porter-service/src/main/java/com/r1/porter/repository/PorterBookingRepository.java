package com.r1.porter.repository;

import com.r1.porter.entity.PorterBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * REPLACE
 * DROP AT:
 *   services/spring-boot/porter-service/src/main/java/com/r1/porter/repository/PorterBookingRepository.java
 */
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

    /**
     * Active (ACCEPTED/IN_PROGRESS) bookings currently held by OFFLINE
     * porters — i.e. jobs a supervisor manually dispatched to a porter who
     * doesn't have app access. Since those porters can't call
     * /bookings/{id}/complete themselves, this is what backs the
     * supervisor's "Manually Assigned Jobs" view so they can mark a job
     * complete on the porter's behalf once it's actually done.
     */
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

    /**
     * Returns bookings for a user WITH porter contact details joined.
     * Columns (0-indexed):
     * 0=id, 1=booking_reference, 2=user_id, 3=porter_id, 4=service_type,
     * 5=status, 6=train_number, 7=coach_number, 8=platform, 9=pnr_number,
     * 10=seat_berth, 11=pickup_location, 12=destination,
     * 13=passenger_name, 14=passenger_mobile, 15=passenger_email,
     * 16=special_instructions, 17=base_amount, 18=gst_amount, 19=total_amount,
     * 20=payment_method, 21=payment_id, 22=service_pin,
     * 23=booking_time, 24=acceptance_time, 25=start_time, 26=completion_time,
     * 27=station_id, 28=created_at,
     * 29=porter_name, 30=porter_phone, 31=porter_badge, 32=porter_zone
     */
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

