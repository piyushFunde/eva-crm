package com.eva.crm.service;

import com.eva.crm.entity.CollectionLog;
import com.eva.crm.entity.Customer;
import com.eva.crm.entity.User;
import com.eva.crm.repository.CollectionLogRepository;
import com.eva.crm.repository.CustomerRepository;
import com.eva.crm.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BackupEmailService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final CollectionLogRepository collectionLogRepository;
    private final ExportService exportService;

    @Value("${app.backup-email}")
    private String recipientEmail;

    @Value("${app.sender-email:onboarding@resend.dev}")
    private String senderEmail;

    @Value("${app.resend-api-key:}")
    private String resendApiKey;

    /**
     * Generates a structural JSON dump of users, customers, and collection logs
     * mapped flatly to prevent circular references during JSON serialization.
     */
    public String generateDatabaseJsonDump() {
        Map<String, Object> dump = new HashMap<>();

        // 1. Map Users
        List<Map<String, Object>> usersDump = userRepository.findAll().stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            map.put("fullName", u.getFullName());
            map.put("role", u.getRole().name());
            map.put("active", u.isActive());
            return map;
        }).collect(Collectors.toList());
        dump.put("users", usersDump);

        // 2. Map Customers
        List<Map<String, Object>> customersDump = customerRepository.findAll().stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("name", c.getName());
            map.put("phone", c.getPhone());
            map.put("emiAmount", c.getEmiAmount());
            map.put("pendingAmount", c.getPendingAmount());
            map.put("status", c.getStatus());
            map.put("dueDate", c.getDueDate() != null ? c.getDueDate().toString() : null);
            map.put("assignedExecutiveId", c.getAssignedExecutive() != null ? c.getAssignedExecutive().getId() : null);
            map.put("createdAt", c.getCreatedAt() != null ? c.getCreatedAt().toString() : null);
            return map;
        }).collect(Collectors.toList());
        dump.put("customers", customersDump);

        // 3. Map Collection Logs
        List<Map<String, Object>> logsDump = collectionLogRepository.findAll().stream().map(l -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", l.getId());
            map.put("customerId", l.getCustomer() != null ? l.getCustomer().getId() : null);
            map.put("executiveId", l.getExecutive() != null ? l.getExecutive().getId() : null);
            map.put("amountCollected", l.getAmountCollected());
            map.put("previousPendingAmount", l.getPreviousPendingAmount());
            map.put("remainingAmount", l.getRemainingAmount());
            map.put("paymentMode", l.getPaymentMode());
            map.put("statusAfterCollection", l.getStatusAfterCollection());
            map.put("notes", l.getNotes());
            map.put("collectedAt", l.getCollectedAt() != null ? l.getCollectedAt().toString() : null);
            map.put("deviceId", l.getDeviceId());
            map.put("clientGeneratedId", l.getClientGeneratedId());
            return map;
        }).collect(Collectors.toList());
        dump.put("collection_logs", logsDump);

        try {
            return new ObjectMapper()
                    .writerWithDefaultPrettyPrinter()
                    .writeValueAsString(dump);
        } catch (Exception e) {
            log.error("Failed to map database values to JSON dump string", e);
            return "{}";
        }
    }

    /**
     * Packages the Excel collection report and the database JSON dump into a single ZIP archive,
     * then emails it using the Resend HTTPS API.
     */
    public void sendBackupEmail() {
        if (recipientEmail == null || recipientEmail.trim().isEmpty() || recipientEmail.equals("test@example.com")) {
            log.warn("Recipient email is not configured or set to default (test@example.com). Skipping backup email send.");
            throw new IllegalArgumentException("Recipient email is not configured or set to default (test@example.com)");
        }

        if (resendApiKey == null || resendApiKey.trim().isEmpty()) {
            log.warn("Resend API Key is not configured. Skipping backup email send.");
            throw new IllegalArgumentException("Resend API Key is not configured. Please set the RESEND_API_KEY environment variable.");
        }

        log.info("Generating database backup ZIP and sending via Resend API to: {}", recipientEmail);

        try {
            // 1. Get Excel report bytes
            User systemAdmin = userRepository.findByRole(com.eva.crm.entity.Role.ROLE_ADMIN)
                    .stream().findFirst().orElse(null);
            byte[] excelReportBytes = exportService.exportCollectionsToExcel(systemAdmin);

            // 2. Get JSON dump bytes
            String jsonDumpStr = generateDatabaseJsonDump();
            byte[] jsonDumpBytes = jsonDumpStr.getBytes(StandardCharsets.UTF_8);

            // 3. Build ZIP archive in memory
            ByteArrayOutputStream zipBbos = new ByteArrayOutputStream();
            try (ZipOutputStream zos = new ZipOutputStream(zipBbos)) {
                // Add Excel file
                ZipEntry excelEntry = new ZipEntry("collections_report.xlsx");
                zos.putNextEntry(excelEntry);
                zos.write(excelReportBytes);
                zos.closeEntry();

                // Add JSON file
                ZipEntry jsonEntry = new ZipEntry("database_backup.json");
                zos.putNextEntry(jsonEntry);
                zos.write(jsonDumpBytes);
                zos.closeEntry();

                zos.finish();
            }

            byte[] zipArchiveBytes = zipBbos.toByteArray();
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String zipFilename = "crm_backup_" + timestamp + ".zip";

            log.info("Backup ZIP file created. Size: {} bytes", zipArchiveBytes.length);

            // Save a debug backup locally on the server disk for safety and validation
            try {
                java.nio.file.Path backupPath = java.nio.file.Paths.get("uploads/backups");
                if (!java.nio.file.Files.exists(backupPath)) {
                    java.nio.file.Files.createDirectories(backupPath);
                }
                java.nio.file.Files.write(backupPath.resolve(zipFilename), zipArchiveBytes);
                log.info("Saved local backup copy to disk: uploads/backups/{}", zipFilename);
            } catch (Exception writeEx) {
                log.warn("Could not save local backup copy on disk (non-critical): {}", writeEx.getMessage());
            }

            // 4. Construct email request body for Resend
            String emailBody = "<h3>EVA CRM System Backup Services</h3>" +
                    "<p>Hello,</p>" +
                    "<p>Attached is the automated daily backup of your EVA CRM database records, generated on <b>" + 
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd 'at' HH:mm:ss")) + "</b>.</p>" +
                    "<p>The attached zip file contains:</p>" +
                    "<ul>" +
                    "<li><b>collections_report.xlsx</b>: A human-readable Excel report summarizing all customer recovery logs, grouped by executive.</li>" +
                    "<li><b>database_backup.json</b>: A complete structural database dump containing all users, customers, and payment transaction logs.</li>" +
                    "</ul>" +
                    "<br/>" +
                    "<p><i>This is an automated system message. Please do not reply directly to this email.</i></p>";

            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> body = new HashMap<>();
            body.put("from", senderEmail);
            body.put("to", List.of(recipientEmail));
            body.put("subject", "EVA CRM - Daily System Backup & Report (" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) + ")");
            body.put("html", emailBody);

            // Resend attachment format: { content: "base64", filename: "name.zip", contentType: "mime/type" }
            Map<String, Object> attachment = new HashMap<>();
            attachment.put("content", java.util.Base64.getEncoder().encodeToString(zipArchiveBytes));
            attachment.put("filename", zipFilename);
            attachment.put("contentType", "application/zip");
            body.put("attachments", List.of(attachment));

            String jsonPayload = mapper.writeValueAsString(body);

            // 5. Send POST request to Resend API
            java.net.http.HttpClient client = java.net.http.HttpClient.newBuilder()
                    .connectTimeout(java.time.Duration.ofSeconds(10))
                    .build();
            java.net.http.HttpRequest httpRequest = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .timeout(java.time.Duration.ofSeconds(10))
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            java.net.http.HttpResponse<String> httpResponse = client.send(httpRequest, java.net.http.HttpResponse.BodyHandlers.ofString());

            if (httpResponse.statusCode() == 200 || httpResponse.statusCode() == 201) {
                log.info("System backup ZIP sent successfully via Resend API to: {}", recipientEmail);
            } else {
                throw new RuntimeException("Resend API error status: " + httpResponse.statusCode() + " - " + httpResponse.body());
            }

        } catch (Exception e) {
            log.error("Failed to generate or send the backup email via Resend API", e);
            throw new RuntimeException("Email delivery failed: " + e.getMessage(), e);
        }
    }

    /**
     * Executes the backup scheduled task according to the cron expression configured.
     */
    @Scheduled(cron = "${app.backup-cron}")
    public void scheduledBackupTrigger() {
        log.info("Triggering scheduled automated CRM backup email run...");
        sendBackupEmail();
    }
}
