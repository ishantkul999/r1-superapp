package com.r1.station.service;

import com.r1.station.dto.AuditLogDto;
import com.r1.station.repository.AuditLogRepo;
import com.r1.station.repository.AuthUserRepo;
import com.r1.station.repository.AuthUserProjection;
import com.r1.station.repository.PorterBookingStatsRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StationControlService {

    private final AuthUserRepo         authUserRepo;
    private final PorterBookingStatsRepo bookingStatsRepo;
    private final AuditLogRepo auditLogRepo;

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    // ── Dashboard ─────────────────────────────────────────────────────────────

    public Map<String, Object> getDashboardStats() {
        long totalUsers      = authUserRepo.countByIsActiveTrue();
        long onlinePorters   = authUserRepo.countByRoleAndIsActiveTrue("PORTER");
        long totalBookings   = bookingStatsRepo.countAll();
        BigDecimal revenue   = bookingStatsRepo.sumAllRevenue();
        long roomBookings    = bookingStatsRepo.countRoomBookings();
        long lockerBookings  = bookingStatsRepo.countLockerBookings();
        long sosAlerts       = bookingStatsRepo.countSosAlerts();

        return Map.of(
                "totalUsers",     totalUsers,
                "onlinePorters",  onlinePorters,
                "totalBookings",  totalBookings,
                "revenue",        revenue != null ? revenue : BigDecimal.ZERO,
                "roomBookings",   roomBookings,
                "lockerBookings", lockerBookings,
                "sosAlerts",      sosAlerts
        );
    }

    // ── Staff ─────────────────────────────────────────────────────────────────

    public List<Map<String, Object>> getStaff() {
        // Fetch all non-USER, non-SUPERADMIN accounts
        List<String> staffRoles = List.of("PORTER", "SUPERVISOR", "RPF", "STATION_CONTROL_ROOM");
        List<Map<String, Object>> result = new ArrayList<>();
        for (String role : staffRoles) {
            List<Object[]> rows = authUserRepo.findUserRowsByRole(role, PageRequest.of(0, 200));
            for (Object[] row : rows) {
                Map<String, Object> staff = new LinkedHashMap<>();
                staff.put("id",          row[0] != null ? row[0].toString() : null);
                staff.put("phone",       row[1]);
                staff.put("name",        row[2]);
                staff.put("email",       row[3]);
                staff.put("role",        row[4]);
                staff.put("joinedAt",    row[5] != null ? row[5].toString() : null);
                staff.put("isActive",    row[6]);
                result.add(staff);
            }
        }
        return result;
    }


    public List<Map<String, Object>> getAllBookings(String type) {
        List<Map<String, Object>> result = new ArrayList<>();

        if (List.of("ALL", "PORTER").contains(type)) {
            List<Object[]> rows = bookingStatsRepo.findAllBookingRows(PageRequest.of(0, 100));
            for (Object[] row : rows) {
                Map<String, Object> b = new LinkedHashMap<>();
                b.put("id",          row[0]);
                b.put("type",        "PORTER");
                b.put("userId",      row[1]);
                b.put("porterId",    row[2]);
                b.put("status",      row[3]);
                b.put("totalAmount", row[4]);
                b.put("createdAt",   row[5] != null ? row[5].toString() : null);
                result.add(b);
            }
        }
        return result;
    }

    // ── Audit Logs ────────────────────────────────────────────────────────────

    public List<AuditLogDto> getAuditLogs(int page, int size) {
        List<Object[]> rows = auditLogRepo.findAllLogs(PageRequest.of(page, size));
        return rows.stream().map(row -> AuditLogDto.builder()
                .id(row[0] != null ? row[0].toString() : null)
                .timestamp(row[1] != null ? row[1].toString() : null)
                .service(row[2] != null ? row[2].toString() : null)
                .actorId(row[3] != null ? row[3].toString() : null)
                .actorName(row[4] != null ? row[4].toString() : null)
                .role(row[5] != null ? row[5].toString() : null)
                .action(row[6] != null ? row[6].toString() : null)
                .resource(row[7] != null ? row[7].toString() : null)
                .outcome(row[8] != null ? row[8].toString() : null)
                .ipAddress(row[9] != null ? row[9].toString() : null)
                .build()
        ).collect(Collectors.toList());
    }

    // ── Analytics ─────────────────────────────────────────────────────────────

    public Map<String, Object> getAnalytics(String period) {
        List<Map<String, Object>> revenueChart = bookingStatsRepo.monthlyRevenueLast6Months();
        long completed   = bookingStatsRepo.countAll();
        BigDecimal total = bookingStatsRepo.sumAllRevenue();

        return Map.of(
                "period",       period,
                "revenueChart", revenueChart,
                "completed",    completed,
                "totalRevenue", total != null ? total : BigDecimal.ZERO,
                "roomBookings", bookingStatsRepo.countRoomBookings(),
                "lockerBookings", bookingStatsRepo.countLockerBookings()
        );
    }
}