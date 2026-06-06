package com.eva.crm.controller;

import com.eva.crm.dto.ApiResponse;
import com.eva.crm.dto.TeamPerformanceDTO;
import com.eva.crm.dto.UserCreateDTO;
import com.eva.crm.entity.User;
import com.eva.crm.repository.CollectionLogRepository;
import com.eva.crm.repository.CustomerRepository;
import com.eva.crm.service.DashboardService;
import com.eva.crm.service.ExcelService;
import com.eva.crm.service.UserService;
import com.eva.crm.service.BackupEmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ExcelService excelService;
    private final DashboardService dashboardService;
    private final UserService userService;
    private final CustomerRepository customerRepository;
    private final CollectionLogRepository collectionLogRepository;
    private final BackupEmailService backupEmailService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/team-performance")
    public ResponseEntity<ApiResponse<java.util.List<TeamPerformanceDTO>>> getTeamPerformance() {
        return ResponseEntity.ok(ApiResponse.success("Team performance fetched", dashboardService.getTeamPerformance()));
    }

    @PostMapping("/upload-customers")
    public ResponseEntity<ApiResponse<com.eva.crm.dto.UploadResponseDTO>> uploadCustomers(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Please select a valid file"));
        }

        try {
            com.eva.crm.dto.UploadResponseDTO result = excelService.processExcelFile(file);
            if (result.isSuccess()) {
                return ResponseEntity.ok(ApiResponse.success(result.getMessage(), result));
            } else {
                // Return 200 but with success:false inside the data, so frontend can show errors
                return ResponseEntity.ok(ApiResponse.success(result.getMessage(), result));
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/executives")
    public ResponseEntity<ApiResponse<List<User>>> getAllExecutives() {
        return ResponseEntity.ok(ApiResponse.success("Executives fetched", userService.getAllExecutives()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/executives")
    public ResponseEntity<ApiResponse<User>> createExecutive(@RequestBody UserCreateDTO dto) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Executive created", userService.createExecutive(dto)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/executives/{id}")
    public ResponseEntity<ApiResponse<String>> deleteExecutive(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("Executive removed", null));
    }

    /** Delete ALL customers (and their collection logs) in one go */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/customers/all")
    @org.springframework.cache.annotation.CacheEvict(value = "analytics", allEntries = true)
    public ResponseEntity<ApiResponse<String>> deleteAllCustomers() {
        try {
            long total = customerRepository.count();
            collectionLogRepository.deleteAll(); // must delete logs first (FK constraint)
            customerRepository.deleteAll();
            return ResponseEntity.ok(ApiResponse.success("Cleared " + total + " customer records successfully", null));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to clear data: " + e.getMessage()));
        }
    }

    /** Delete only PENDING customers (preserves collected history) */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/customers/pending")
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "analytics", allEntries = true)
    public ResponseEntity<ApiResponse<String>> deletePendingCustomers() {
        try {
            int deleted = customerRepository.deleteByStatus("PENDING");
            return ResponseEntity.ok(ApiResponse.success("Cleared " + deleted + " pending records successfully", null));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to clear pending data: " + e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/backup/email-trigger")
    public ResponseEntity<ApiResponse<String>> triggerBackupEmail() {
        try {
            backupEmailService.sendBackupEmail();
            return ResponseEntity.ok(ApiResponse.success("Backup email triggered successfully", null));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to trigger backup email: " + e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/backup/download-latest")
    public ResponseEntity<org.springframework.core.io.Resource> downloadLatestBackup() {
        try {
            java.io.File directory = new java.io.File("uploads/backups");
            if (!directory.exists() || !directory.isDirectory()) {
                return ResponseEntity.notFound().build();
            }

            java.io.File[] files = directory.listFiles((dir, name) -> name.startsWith("crm_backup_") && name.endsWith(".zip"));
            if (files == null || files.length == 0) {
                return ResponseEntity.notFound().build();
            }

            // Find the most recently modified file
            java.io.File latestFile = java.util.Arrays.stream(files)
                    .max(java.util.Comparator.comparingLong(java.io.File::lastModified))
                    .orElse(null);

            if (latestFile == null) {
                return ResponseEntity.notFound().build();
            }

            java.nio.file.Path path = latestFile.toPath();
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(path.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok()
                    .contentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM)
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + latestFile.getName() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
