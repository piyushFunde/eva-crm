package com.eva.crm.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class DashboardResponseDTO {
    private BigDecimal todayTarget;
    private BigDecimal todayCollected;
    private BigDecimal todayPending;
}
