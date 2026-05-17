package com.eva.crm.controller;

import com.eva.crm.dto.ApiResponse;
import com.eva.crm.entity.User;
import com.eva.crm.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/export")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ExportController {

    private final ExportService exportService;

    @GetMapping("/collections/excel")
    public ResponseEntity<byte[]> exportExcel(@AuthenticationPrincipal User admin) throws IOException {
        byte[] data = exportService.exportCollectionsToExcel(admin);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=collections.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(data);
    }

    @GetMapping("/collections/pdf")
    public ResponseEntity<byte[]> exportPdf(@AuthenticationPrincipal User admin) throws IOException {
        byte[] data = exportService.exportCollectionsToPdf(admin);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=collections.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }

    @GetMapping("/collections/csv")
    public ResponseEntity<String> exportCsv(@AuthenticationPrincipal User admin) {
        String data = exportService.exportCollectionsToCsv(admin);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=collections.csv")
                .contentType(MediaType.TEXT_PLAIN)
                .body(data);
    }

    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<java.util.List<com.eva.crm.entity.ExportLog>>> getLogs() {
        return ResponseEntity.ok(ApiResponse.success("Recent logs fetched", exportService.getRecentLogs()));
    }
}
