package com.r1.porter.dto;

import com.r1.porter.entity.PorterBooking;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

/**
 * DROP AT:
 *   services/spring-boot/porter-service/src/main/java/com/r1/porter/dto/PorterDashboardDto.java
 */
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

    // Today stats
    private long       todayCompleted;
    private BigDecimal todayEarnings;

    // Week stats
    private long       weekCompleted;
    private BigDecimal weekEarnings;

    // Current job — null when idle
    private PorterBooking activeJob;

    // How many PENDING_ACCEPTANCE requests a porter can pick up
    private long pendingRequestsCount;
}
