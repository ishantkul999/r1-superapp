package com.r1.station.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class PlatformOverviewDto {
    private long totalUsers;
    private long totalPorters;
    private long totalBookings;
    private BigDecimal totalRevenue;
    private long activeSessions;        // proxy: online porters
    private long totalSos;
    private List<Map<String, Object>> revenueChart;   // [{month:"Jan", revenue:12000}, ...]
    private List<Map<String, Object>> bookingMix;     // [{name:"Porter", value:450}, ...]
}
