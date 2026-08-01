package com.r1.station.service;

import com.r1.station.dto.AuditLogDto;
import com.r1.station.dto.PlatformOverviewDto;
import com.r1.station.dto.UserSummaryDto;
import com.r1.station.repository.AuditLogRepo;
import com.r1.station.repository.AuthUserRepo;
import com.r1.station.repository.PorterBookingStatsRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;
@Slf4j
@Service
@RequiredArgsConstructor
public class SuperAdminService {

    private final AuthUserRepo authUserRepo;
    private final PorterBookingStatsRepo bookingStatsRepo;
    private final AuditLogRepo auditLogRepo;

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    // ── Platform Overview ─────────────────────────────────────────────────────

    public PlatformOverviewDto getPlatformOverview() {
        long totalUsers    = authUserRepo.countByIsActiveTrue();
        long totalPorters  = authUserRepo.countByRoleAndIsActiveTrue("PORTER");
        long totalBookings = bookingStatsRepo.countAll();
        BigDecimal revenue = bookingStatsRepo.sumAllRevenue();
        if (revenue == null) revenue = BigDecimal.ZERO;
        long activeSessions = authUserRepo.countByRoleAndIsActiveTrue("PORTER"); // proxy
        long totalSos       = bookingStatsRepo.countSosAlerts();

        List<Map<String, Object>> revenueChart = bookingStatsRepo.monthlyRevenueLast6Months();
        List<Map<String, Object>> bookingMix   = buildBookingMix();

        return PlatformOverviewDto.builder()
                .totalUsers(totalUsers)
                .totalPorters(totalPorters)
                .totalBookings(totalBookings)
                .totalRevenue(revenue)
                .activeSessions(activeSessions)
                .totalSos(totalSos)
                .revenueChart(revenueChart)
                .bookingMix(bookingMix)
                .build();
    }

    // ── User Management ───────────────────────────────────────────────────────

    public List<UserSummaryDto> getAllUsers(String roleFilter, int page, int size) {
        List<Object[]> rows = "ALL".equals(roleFilter)
                ? authUserRepo.findAllUserRows(PageRequest.of(page, size))
                : authUserRepo.findUserRowsByRole(roleFilter, PageRequest.of(page, size));

        return rows.stream().map(row -> UserSummaryDto.builder()
                .id(row[0].toString())
                .phone(row[1] != null ? row[1].toString() : null)
                .name(row[2] != null ? row[2].toString() : null)
                .email(row[3] != null ? row[3].toString() : null)
                .role(row[4] != null ? row[4].toString() : null)
                .registeredAt(row[5] != null ? row[5].toString() : null)
                .isBlocked(row[6] != null && !(Boolean) row[6])
                .build()
        ).collect(Collectors.toList());
    }

    @Transactional
    public void setUserActive(UUID userId, boolean active) {
        authUserRepo.setUserActive(userId, active);
    }

    // ── Audit Logs ────────────────────────────────────────────────────────────

    public List<AuditLogDto> getAuditLogs(String service, int page, int size) {
        List<Object[]> rows = "ALL".equals(service)
                ? auditLogRepo.findAllLogs(PageRequest.of(page, size))
                : auditLogRepo.findLogsByService(service, PageRequest.of(page, size));

        return rows.stream().map(row -> AuditLogDto.builder()
                .id(row[0].toString())
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

    // ── System Config ─────────────────────────────────────────────────────────

    public void saveConfig(Map<String, Object> config) {
        log.info("System config saved: {}", config.keySet());
    }

    // ── Broadcast ─────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public void broadcast(Map<String, Object> request) {
        String title = (String) request.get("title");
        String body  = (String) request.get("body");
        String type  = (String) request.getOrDefault("type", "IN_APP");
        List<String> targetRoles = (List<String>) request.get("targetRoles");

        log.info("Broadcasting [{}] to roles {}: '{}' — {}", type, targetRoles, title, body);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private List<Map<String, Object>> buildBookingMix() {
        long porterCount = bookingStatsRepo.countByServicePrefix("PORTER");
        long roomCount   = bookingStatsRepo.countRoomBookings();
        long lockerCount = bookingStatsRepo.countLockerBookings();

        return List.of(
                Map.of("name", "Porter", "value", porterCount),
                Map.of("name", "Rooms",  "value", roomCount),
                Map.of("name", "Lockers","value", lockerCount)
        );
    }
}
