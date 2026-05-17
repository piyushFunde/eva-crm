package com.eva.crm.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface TrendData {
    LocalDate getTrendDate();
    BigDecimal getAmount();
}
