package com.eva.crm.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class CustomerResponseDTO {
    private Long id;
    private String name;
    private String phone;
    private String address;
    private BigDecimal emiAmount;
    private LocalDate dueDate;
    private String status;
    private Long executiveId;
    private String executiveName;
}
