package com.r1.station.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Native-query repo for cross-schema aggregate stats used by SuperAdminService.
 * Reads from porter_svc, station_svc, and sos_svc schemas.
 *
 * The datasource user for station-dashboard-service must have SELECT on:
 *   - porter_svc.porter_bookings
 *   - station_svc.station_room_bookings
 *   - station_svc.locker_bookings
 *   - sos_svc.alerts
 *
 * SQL to grant (run as superuser):
 *   GRANT SELECT ON ALL TABLES IN SCHEMA porter_svc TO r1user;
 *   GRANT SELECT ON ALL TABLES IN SCHEMA sos_svc    TO r1user;
 *
 * DROP AT: services/spring-boot/station-dashboard-service/src/main/java/com/r1/station/repository/PorterBookingStatsRepo.java
 */
@Component
public interface PorterBookingStatsRepo extends Repository<AuthUserProjection, UUID> {

    @Query(value = "SELECT COUNT(*) FROM porter_svc.porter_bookings",
            nativeQuery = true)
    long countAll();

    @Query(value = "SELECT COALESCE(SUM(total_amount), 0) FROM porter_svc.porter_bookings WHERE status = 'COMPLETED'",
            nativeQuery = true)
    BigDecimal sumAllRevenue();

    @Query(value = "SELECT COUNT(*) FROM sos_svc.alerts",
            nativeQuery = true)
    long countSosAlerts();

    /**
     * @param prefix unused — kept for interface symmetry; always returns porter booking count
     */
    @Query(value = "SELECT COUNT(*) FROM porter_svc.porter_bookings WHERE status = 'COMPLETED'",
            nativeQuery = true)
    long countByServicePrefix(String prefix);

    @Query(value = "SELECT COUNT(*) FROM station_svc.station_room_bookings WHERE status IN ('CONFIRMED','CHECKED_IN')",
            nativeQuery = true)
    long countRoomBookings();

    @Query(value = "SELECT COUNT(*) FROM station_svc.locker_bookings WHERE status IN ('CONFIRMED','ACTIVE')",
            nativeQuery = true)
    long countLockerBookings();

    /**
     * Returns monthly revenue for the last 6 months.
     * Result shape: [{month: "Jan", revenue: 12000}, ...]
     */
    @Query(value = """
        SELECT TO_CHAR(DATE_TRUNC('month', completion_time AT TIME ZONE 'Asia/Kolkata'), 'Mon') AS month,
               COALESCE(SUM(total_amount), 0) AS revenue
        FROM porter_svc.porter_bookings
        WHERE status = 'COMPLETED'
          AND completion_time >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', completion_time AT TIME ZONE 'Asia/Kolkata')
        ORDER BY DATE_TRUNC('month', completion_time AT TIME ZONE 'Asia/Kolkata')
        """,
            nativeQuery = true)
    List<Map<String, Object>> monthlyRevenueLast6Months();

    @Query(value = """
    SELECT
        pb.id,
        pb.user_id,
        pb.porter_id,
        pb.status,
        pb.total_amount,
        pb.created_at
    FROM porter_svc.porter_bookings pb
    ORDER BY pb.created_at DESC
    """,
            nativeQuery = true)
    List<Object[]> findAllBookingRows(Pageable pageable);
}
