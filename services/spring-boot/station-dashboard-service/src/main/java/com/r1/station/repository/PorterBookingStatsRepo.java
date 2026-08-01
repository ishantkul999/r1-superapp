package com.r1.station.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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

    @Query(value = "SELECT COUNT(*) FROM porter_svc.porter_bookings WHERE status = 'COMPLETED'",
            nativeQuery = true)
    long countByServicePrefix(String prefix);

    @Query(value = "SELECT COUNT(*) FROM station_svc.station_room_bookings WHERE status IN ('CONFIRMED','CHECKED_IN')",
            nativeQuery = true)
    long countRoomBookings();

    @Query(value = "SELECT COUNT(*) FROM station_svc.locker_bookings WHERE status IN ('CONFIRMED','ACTIVE')",
            nativeQuery = true)
    long countLockerBookings();

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
