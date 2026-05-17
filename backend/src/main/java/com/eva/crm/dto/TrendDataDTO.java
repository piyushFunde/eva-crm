package com.eva.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TrendDataDTO {
    private java.time.LocalDate date;
    private java.math.BigDecimal amount;
}
