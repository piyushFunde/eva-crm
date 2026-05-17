package com.eva.crm.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class CollectionHistoryDTO {
    private Long id;
    private String customerName;
    private String customerPhone;
    private String executiveName;
    private BigDecimal amountCollected;
    private BigDecimal previousPendingAmount;
    private BigDecimal remainingAmount;
    private String paymentMode;
    private String notes;
    private String receiptImagePath;
    private String statusAfterCollection;
    private LocalDateTime collectedAt;
}
