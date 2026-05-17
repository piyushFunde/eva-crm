package com.eva.crm.service;

import com.eva.crm.entity.Customer;
import com.eva.crm.entity.Role;
import com.eva.crm.entity.User;
import com.eva.crm.repository.CustomerRepository;
import com.eva.crm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ExcelService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final DataFormatter dataFormatter = new DataFormatter();

    @Transactional
    public com.eva.crm.dto.UploadResponseDTO processExcelFile(MultipartFile file) {
        int count = 0;
        List<String> errors = new ArrayList<>();
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            List<Customer> customers = new ArrayList<>();

            // Start from row 1 (assuming row 0 is header)
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                try {
                    String name = getCellValue(row, 0);
                    String phone = getCellValue(row, 1);
                    String address = getCellValue(row, 2);
                    String amountStr = getCellValue(row, 3);
                    String execUsername = getCellValue(row, 4);

                    if (name.isEmpty() || phone.isEmpty() || amountStr.isEmpty()) {
                        errors.add("Row " + (i + 1) + ": Missing required fields (Name, Phone, or Amount)");
                        continue;
                    }

                    // Clean amount string
                    String cleanedAmount = amountStr.replaceAll("[^0-9.]", "");
                    if (cleanedAmount.isEmpty()) cleanedAmount = "0";
                    BigDecimal emiAmount = new BigDecimal(cleanedAmount);

                    User executive = null;
                    if (!execUsername.isEmpty()) {
                        String rawName = execUsername.trim();
                        String normalizedUsername = rawName.toLowerCase().replaceAll("\\s+", "");
                        
                        // 1. Try to find by normalized username
                        Optional<User> execOpt = userRepository.findByUsername(normalizedUsername);
                        if (execOpt.isPresent()) {
                            executive = execOpt.get();
                        } else {
                            // 2. Try match by full name (ignore case/extra spaces)
                            List<User> allUsers = userRepository.findAll();
                            executive = allUsers.stream()
                                    .filter(u -> u.getFullName().trim().equalsIgnoreCase(rawName))
                                    .findFirst()
                                    .orElse(null);
                            
                            // 3. Auto-Register if still not found
                            if (executive == null) {
                                executive = User.builder()
                                        .fullName(rawName)
                                        .username(normalizedUsername)
                                        .password(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("Staff@123"))
                                        .role(Role.ROLE_EXECUTIVE)
                                        .build();
                                executive = userRepository.saveAndFlush(executive); // Save and flush immediately
                            }
                        }
                    }

                    Customer customer = Customer.builder()
                            .name(name)
                            .phone(phone)
                            .address(address)
                            .emiAmount(emiAmount)
                            .dueDate(LocalDate.now())
                            .status("PENDING")
                            .assignedExecutive(executive)
                            .build();

                    customers.add(customer);
                    count++;
                } catch (Exception e) {
                    errors.add("Row " + (i + 1) + ": " + e.getMessage());
                }
            }

            customerRepository.saveAll(customers);
            
            return com.eva.crm.dto.UploadResponseDTO.builder()
                    .success(errors.isEmpty())
                    .message(errors.isEmpty() ? "Successfully processed " + count + " customers" : "Processed with some issues")
                    .processedCount(count)
                    .errors(errors)
                    .build();

        } catch (Exception e) {
            return com.eva.crm.dto.UploadResponseDTO.builder()
                    .success(false)
                    .message("File processing failed: " + e.getMessage())
                    .processedCount(0)
                    .errors(List.of(e.getMessage()))
                    .build();
        }
    }

    private String getCellValue(Row row, int cellIndex) {
        if (row.getCell(cellIndex) == null)
            return "";
        String value = dataFormatter.formatCellValue(row.getCell(cellIndex));
        return value != null ? value.trim() : "";
    }
}
