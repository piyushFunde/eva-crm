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
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.security.crypto.password.PasswordEncoder;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExcelService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
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

            // Cache users to avoid N+1 query inside loop
            List<User> allUsers = userRepository.findAll();
            Map<String, User> usernameMap = allUsers.stream()
                    .collect(Collectors.toMap(User::getUsername, u -> u, (u1, u2) -> u1));
            Map<String, User> nameMap = allUsers.stream()
                    .filter(u -> u.getFullName() != null)
                    .collect(Collectors.toMap(u -> u.getFullName().trim().toLowerCase(), u -> u, (u1, u2) -> u1));

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

                    Customer customer = buildCustomer(dateStr, phone, name, amountStr, fosId, fosName, usernameMap, nameMap);
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

        // Column index map — will be set from header row
        int[] idxMap = {0, 1, 2, 3, 4, 5}; // defaults: date, phone, name, amount, fosId, fosName

        // Cache users to avoid N+1 query inside loop
        List<User> allUsers = userRepository.findAll();
        Map<String, User> usernameMap = allUsers.stream()
                .collect(Collectors.toMap(User::getUsername, u -> u, (u1, u2) -> u1));
        Map<String, User> nameMap = allUsers.stream()
                .filter(u -> u.getFullName() != null)
                .collect(Collectors.toMap(u -> u.getFullName().trim().toLowerCase(), u -> u, (u1, u2) -> u1));

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(new ByteArrayInputStream(bytes), StandardCharsets.UTF_8))) {

            String line;
            int rowIndex = 0;

            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) { rowIndex++; continue; }

                String[] cols = line.split(delimiter, -1);

                // Parse header row to detect column positions dynamically
                if (rowIndex == 0) {
                    idxMap = detectColumns(cols);
                    log.info("CSV column map detected: date={}, phone={}, name={}, amount={}, fosId={}, fosName={}",
                            idxMap[0], idxMap[1], idxMap[2], idxMap[3], idxMap[4], idxMap[5]);
                    rowIndex++;
                    continue;
                }

                try {
                    String dateStr   = safeGet(cols, idxMap[0]);
                    String phone     = safeGet(cols, idxMap[1]);
                    String name      = safeGet(cols, idxMap[2]);
                    String amountStr = safeGet(cols, idxMap[3]);
                    String fosId     = safeGet(cols, idxMap[4]);
                    String fosName   = safeGet(cols, idxMap[5]);

                    if (name.isEmpty() || phone.isEmpty() || amountStr.isEmpty()) {
                        errors.add("Row " + (rowIndex + 1) + ": Missing required fields");
                        rowIndex++;
                        continue;
                    }

                    Customer customer = buildCustomer(dateStr, phone, name, amountStr, fosId, fosName, usernameMap, nameMap);
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
                                   String amountStr, String fosId, String fosName,
                                   java.util.Map<String, User> usernameMap,
                                   java.util.Map<String, User> nameMap) {
        // Clean amount
        String cleanedAmount = amountStr.replaceAll("[^0-9.]", "");
        if (cleanedAmount.isEmpty()) cleanedAmount = "0";
        BigDecimal emiAmount = new BigDecimal(cleanedAmount);

        // Parse date (dd.MM.yyyy), fallback to other common formats, then today
        LocalDate dueDate = LocalDate.now();
        if (!dateStr.isEmpty()) {
            String trimmed = dateStr.trim();
            try {
                dueDate = LocalDate.parse(trimmed, java.time.format.DateTimeFormatter.ofPattern("dd.MM.yyyy"));
            } catch (Exception e1) {
                try {
                    dueDate = LocalDate.parse(trimmed, java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                } catch (Exception e2) {
                    try {
                        dueDate = LocalDate.parse(trimmed, java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
                    } catch (Exception e3) {
                        try {
                            dueDate = LocalDate.parse(trimmed, java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy"));
                        } catch (Exception e4) {
                            log.warn("Failed to parse date '{}', defaulting to today", dateStr);
                        }
                    }
                }
            }
        }

        // Resolve or auto-create executive
        User executive = null;
        if (!fosId.trim().isEmpty()) {
            String username = fosId.trim();
            if (usernameMap.containsKey(username)) {
                executive = usernameMap.get(username);
            } else {
                String rawName = fosName.trim();
                String lowerName = rawName.toLowerCase();
                if (!lowerName.isEmpty() && nameMap.containsKey(lowerName)) {
                    executive = nameMap.get(lowerName);
                } else {
                    executive = User.builder()
                            .fullName(rawName.isEmpty() ? "FOS " + username : rawName)
                            .username(username)
                            .password(passwordEncoder.encode("Staff@123"))
                            .role(Role.ROLE_EXECUTIVE)
                            .build();
                    executive = userRepository.saveAndFlush(executive);
                    log.info("Auto-registered new executive: username={}, name={}", username, executive.getFullName());
                    // Cache the new executive
                    usernameMap.put(username, executive);
                    if (!lowerName.isEmpty()) {
                        nameMap.put(lowerName, executive);
                    }
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
        if (index < 0 || index >= arr.length) return "";
        String val = arr[index];
        // Remove surrounding quotes if CSV quoted
        if (val != null && val.startsWith("\"") && val.endsWith("\"")) {
            val = val.substring(1, val.length() - 1);
        }
        return val != null ? val.trim() : "";
    }

    /**
     * Auto-detect column positions from the header row by matching known keywords.
     * Handles both 6-column TSV (no Column D) and 7-column Excel (with empty Column D).
     */
    private int[] detectColumns(String[] headers) {
        int dateIdx = 0, phoneIdx = 1, nameIdx = 2, amountIdx = 3, fosIdIdx = 4, fosNameIdx = 5;

        for (int i = 0; i < headers.length; i++) {
            String h = safeGet(headers, i).toLowerCase();
            if (h.contains("date"))                      dateIdx   = i;
            else if (h.contains("prm") || h.contains("id") && i < 3) phoneIdx = i;
            else if (h.contains("partner name") || h.contains("name") && i < 4) nameIdx = i;
            else if (h.contains("amount") || h.contains("transfer"))   amountIdx = i;
            else if (h.contains("fos id") || (h.contains("fos") && h.contains("id"))) fosIdIdx = i;
            else if (h.contains("fos name") || (h.contains("fos") && h.contains("name"))) fosNameIdx = i;
        }

        return new int[]{dateIdx, phoneIdx, nameIdx, amountIdx, fosIdIdx, fosNameIdx};
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
