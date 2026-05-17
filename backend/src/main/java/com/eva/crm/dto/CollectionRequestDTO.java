package com.eva.crm.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

@Data
public class CollectionRequestDTO {
    
    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.0", message = "Amount must be greater than 0")
    private BigDecimal amountCollected;

    @NotBlank(message = "Payment mode is required")
    private String paymentMode;

    private String notes;
    private String clientGeneratedId;
    private String deviceId;

    // We use MultipartFile for handling file uploads in Spring Boot
    private MultipartFile receiptImage;
}
