package com.r1.porter.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SupervisorDashboardDto {
    private long activePorters;
    private long onlinePorters;
    private long unassigned;
    private long todayBookings;
    private long completed;
    private long pendingCod;
}