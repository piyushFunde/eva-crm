package com.eva.crm.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class UploadResponseDTO {
    private boolean success;
    private String message;
    private int processedCount;
    private List<String> errors;
}
