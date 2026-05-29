package com.eva.crm.service;

import com.eva.crm.entity.Customer;
import com.eva.crm.entity.Role;
import com.eva.crm.entity.User;
import com.eva.crm.repository.CustomerRepository;
import com.eva.crm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExcelService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final DataFormatter dataFormatter = new DataFormatter();

    @Transactional
    public com.eva.crm.dto.UploadResponseDTO processExcelFile(MultipartFile file) {
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (Exception e) {
            log.error("Failed to read uploaded file bytes", e);
            return errorResponse("Could not read uploaded file: " + e.getMessage());
        }

        log.info("Processing file: name={}, size={} bytes", file.getOriginalFilename(), bytes.length);

        // Strategy 1: Try as real Excel (.xls or .xlsx) using ByteArrayInputStream
        // ByteArrayInputStream natively supports mark/reset which WorkbookFactory needs
        try {
            return processWithPoi(bytes);
        } catch (Exception poiEx) {
            log.warn("POI Excel parsing failed ({}), trying CSV fallback...", poiEx.getMessage());
        }

        // Strategy 2: Fallback — try as tab-separated (TSV) or comma-separated (CSV)
        // This handles "fake XLS" files that are actually TSV/CSV saved with .xls extension
        try {
            return processAsCsv(bytes);
        } catch (Exception csvEx) {
            log.error("CSV fallback also failed", csvEx);
            return errorResponse(
                "File format not supported. Please upload a real Excel file (.xlsx or .xls). " +
                "If you are exporting from a system, try 'Save As > Excel Workbook (.xlsx)' instead of just renaming the file."
            );
        }
    }

    // ─── Strategy 1: Apache POI (real Excel files) ──────────────────────────────

    private com.eva.crm.dto.UploadResponseDTO processWithPoi(byte[] bytes) throws Exception {
        int count = 0;
        List<String> errors = new ArrayList<>();

        try (ByteArrayInputStream bais = new ByteArrayInputStream(bytes);
             Workbook workbook = WorkbookFactory.create(bais)) {

            Sheet sheet = workbook.getSheetAt(0);
            List<Customer> customers = new ArrayList<>();

            // Row 0 = header, data starts at row 1
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                try {
                    String dateStr   = getCellValue(row, 0);  // Column A: Order Date
                    String phone     = getCellValue(row, 1);  // Column B: Partner PRM ID
                    String name      = getCellValue(row, 2);  // Column C: Partner Name
                    String amountStr = getCellValue(row, 4);  // Column E: Transfer Amount
                    String fosId     = getCellValue(row, 5);  // Column F: FOS ID
                    String fosName   = getCellValue(row, 6);  // Column G: FOS Name

                    if (name.isEmpty() || phone.isEmpty() || amountStr.isEmpty()) {
                        errors.add("Row " + (i + 1) + ": Missing required fields (Name, PRM ID, or Amount)");
                        continue;
                    }

                    Customer customer = buildCustomer(dateStr, phone, name, amountStr, fosId, fosName);
                    customers.add(customer);
                    count++;
                } catch (Exception e) {
                    errors.add("Row " + (i + 1) + ": " + e.getMessage());
                }
            }

            customerRepository.saveAll(customers);
            log.info("POI: processed {} customers, {} errors", count, errors.size());

            return com.eva.crm.dto.UploadResponseDTO.builder()
                    .success(true)
                    .message("Successfully processed " + count + " customers" + (errors.isEmpty() ? "" : " (with " + errors.size() + " skipped rows)"))
                    .processedCount(count)
                    .errors(errors)
                    .build();
        }
    }

    // ─── Strategy 2: CSV / TSV fallback ─────────────────────────────────────────

    private com.eva.crm.dto.UploadResponseDTO processAsCsv(byte[] bytes) throws Exception {
        int count = 0;
        List<String> errors = new ArrayList<>();
        List<Customer> customers = new ArrayList<>();

        String content = new String(bytes, StandardCharsets.UTF_8);
        // Detect delimiter: tab-separated (TSV) or comma-separated (CSV)
        String firstLine = content.lines().findFirst().orElse("");
        String delimiter = firstLine.contains("\t") ? "\t" : ",";

        log.info("CSV fallback using delimiter: '{}'", delimiter.equals("\t") ? "TAB" : ",");

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(new ByteArrayInputStream(bytes), StandardCharsets.UTF_8))) {

            String line;
            int rowIndex = 0;

            while ((line = reader.readLine()) != null) {
                if (rowIndex == 0) { rowIndex++; continue; } // skip header row

                if (line.trim().isEmpty()) { rowIndex++; continue; }

                String[] cols = line.split(delimiter, -1);

                try {
                    String dateStr   = safeGet(cols, 0);  // Column A
                    String phone     = safeGet(cols, 1);  // Column B
                    String name      = safeGet(cols, 2);  // Column C
                    String amountStr = safeGet(cols, 4);  // Column E
                    String fosId     = safeGet(cols, 5);  // Column F
                    String fosName   = safeGet(cols, 6);  // Column G

                    if (name.isEmpty() || phone.isEmpty() || amountStr.isEmpty()) {
                        errors.add("Row " + (rowIndex + 1) + ": Missing required fields");
                        rowIndex++;
                        continue;
                    }

                    Customer customer = buildCustomer(dateStr, phone, name, amountStr, fosId, fosName);
                    customers.add(customer);
                    count++;
                } catch (Exception e) {
                    errors.add("Row " + (rowIndex + 1) + ": " + e.getMessage());
                }

                rowIndex++;
            }
        }

        if (count == 0) {
            throw new Exception("No valid rows found in CSV/TSV format either");
        }

        customerRepository.saveAll(customers);
        log.info("CSV: processed {} customers, {} errors", count, errors.size());

        return com.eva.crm.dto.UploadResponseDTO.builder()
                .success(true)
                .message("Successfully processed " + count + " customers" + (errors.isEmpty() ? "" : " (with " + errors.size() + " skipped rows)"))
                .processedCount(count)
                .errors(errors)
                .build();
    }

    // ─── Shared: Build a Customer from raw field strings ────────────────────────

    private Customer buildCustomer(String dateStr, String phone, String name,
                                   String amountStr, String fosId, String fosName) {
        // Clean amount
        String cleanedAmount = amountStr.replaceAll("[^0-9.]", "");
        if (cleanedAmount.isEmpty()) cleanedAmount = "0";
        BigDecimal emiAmount = new BigDecimal(cleanedAmount);

        // Parse date (dd.MM.yyyy), fallback to today
        LocalDate dueDate = LocalDate.now();
        if (!dateStr.isEmpty()) {
            try {
                dueDate = LocalDate.parse(dateStr.trim(),
                        java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy"));
            } catch (Exception ignored) { /* use today */ }
        }

        // Resolve or auto-create executive
        User executive = null;
        if (!fosId.trim().isEmpty()) {
            String username = fosId.trim();
            Optional<User> execOpt = userRepository.findByUsername(username);
            if (execOpt.isPresent()) {
                executive = execOpt.get();
            } else {
                String rawName = fosName.trim();
                List<User> allUsers = userRepository.findAll();
                executive = allUsers.stream()
                        .filter(u -> u.getFullName().trim().equalsIgnoreCase(rawName))
                        .findFirst()
                        .orElse(null);

                if (executive == null) {
                    executive = User.builder()
                            .fullName(rawName.isEmpty() ? "FOS " + username : rawName)
                            .username(username)
                            .password(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder()
                                    .encode("Staff@123"))
                            .role(Role.ROLE_EXECUTIVE)
                            .build();
                    executive = userRepository.saveAndFlush(executive);
                    log.info("Auto-registered new executive: username={}, name={}", username, executive.getFullName());
                }
            }
        }

        return Customer.builder()
                .name(name)
                .phone(phone)
                .address("Partner ID: " + phone)
                .emiAmount(emiAmount)
                .dueDate(dueDate)
                .status("PENDING")
                .assignedExecutive(executive)
                .build();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private String getCellValue(Row row, int cellIndex) {
        if (row.getCell(cellIndex) == null) return "";
        String value = dataFormatter.formatCellValue(row.getCell(cellIndex));
        return value != null ? value.trim() : "";
    }

    private String safeGet(String[] arr, int index) {
        if (index >= arr.length) return "";
        String val = arr[index];
        // Remove surrounding quotes if CSV quoted
        if (val != null && val.startsWith("\"") && val.endsWith("\"")) {
            val = val.substring(1, val.length() - 1);
        }
        return val != null ? val.trim() : "";
    }

    private com.eva.crm.dto.UploadResponseDTO errorResponse(String message) {
        return com.eva.crm.dto.UploadResponseDTO.builder()
                .success(false)
                .message(message)
                .processedCount(0)
                .errors(List.of(message))
                .build();
    }
}
