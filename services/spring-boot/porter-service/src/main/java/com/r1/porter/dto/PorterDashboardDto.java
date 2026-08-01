package com.r1.porter.dto;

import com.r1.porter.entity.PorterBooking;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class PorterDashboardDto {
    private String  porterId;
    private String  badgeNumber;
    private String  serviceType;
    private String  zone;
    private boolean isOnline;
    private BigDecimal avgRating;
    private int     totalServices;

    private long       todayCompleted;
    private BigDecimal todayEarnings;

    private long       weekCompleted;
    private BigDecimal weekEarnings;

    private PorterBooking activeJob;

    private long pendingRequestsCount;
}
