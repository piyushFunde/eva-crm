package com.eva.crm.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class TeamPerformanceDTO {
    private Long executiveId;
    private String name;
    private long customers;
    private BigDecimal target;
    private BigDecimal collected;
}
