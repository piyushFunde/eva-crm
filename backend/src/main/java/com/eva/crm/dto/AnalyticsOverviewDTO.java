package com.eva.crm.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class AnalyticsOverviewDTO {
    private long totalCustomers;
    private BigDecimal totalCollected;
    private BigDecimal totalPending;
    private BigDecimal todayCollections;
    private BigDecimal monthlyCollections;
    private double successRate;
    private long activeExecutives;
}
