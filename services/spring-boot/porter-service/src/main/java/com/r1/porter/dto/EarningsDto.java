package com.r1.porter.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class EarningsDto {
    private String     period;
    private long       completedJobs;
    private BigDecimal totalEarnings;
    private BigDecimal avgPerJob;
    private BigDecimal platformCut;
    private BigDecimal netEarnings;
}
