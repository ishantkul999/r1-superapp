package com.r1.porter.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

/**
 * DROP AT:
 *   services/spring-boot/porter-service/src/main/java/com/r1/porter/dto/EarningsDto.java
 */
@Data
@Builder
public class EarningsDto {
    private String     period;          // TODAY | WEEK | MONTH
    private long       completedJobs;
    private BigDecimal totalEarnings;
    private BigDecimal avgPerJob;
    private BigDecimal platformCut;     // 10 % deduction (informational)
    private BigDecimal netEarnings;
}
