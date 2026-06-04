package com.eva.crm.service;

import com.eva.crm.entity.CollectionLog;
import com.eva.crm.entity.Customer;
import com.eva.crm.entity.ExportLog;
import com.eva.crm.entity.User;
import com.eva.crm.repository.CollectionLogRepository;
import com.eva.crm.repository.CustomerRepository;
import com.eva.crm.repository.ExportLogRepository;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Collections;
import java.util.stream.Collectors;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExportService {

    private final CollectionLogRepository collectionLogRepository;
    private final ExportLogRepository exportLogRepository;
    private final CustomerRepository customerRepository;

    public byte[] exportCollectionsToExcel(User admin) throws IOException {
        List<Customer> customers = customerRepository.findAll();
        List<CollectionLog> logs = collectionLogRepository.findAll();
        
        Map<Long, List<CollectionLog>> logsByCustomerId = logs.stream()
                .filter(log -> log.getCustomer() != null)
                .collect(Collectors.groupingBy(log -> log.getCustomer().getId()));

        Map<String, List<Customer>> customersByExecutive = new TreeMap<>();
        for (Customer c : customers) {
            String execName = c.getAssignedExecutive() != null 
                    ? c.getAssignedExecutive().getFullName() 
                    : "Unassigned";
            customersByExecutive.computeIfAbsent(execName, k -> new ArrayList<>()).add(c);
        }

        log.info("Starting Excel export for user: {}, customer count: {}", admin.getUsername(), customers.size());
        
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Collection & Pending Report");
            
            // Styles
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.BLUE_GREY.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            CellStyle execHeaderStyle = workbook.createCellStyle();
            execHeaderStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            execHeaderStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            org.apache.poi.ss.usermodel.Font execFont = workbook.createFont();
            execFont.setBold(true);
            execHeaderStyle.setFont(execFont);

            CellStyle totalStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font totalFont = workbook.createFont();
            totalFont.setBold(true);
            totalStyle.setFont(totalFont);

            String[] columns = {"Customer", "Phone", "Status", "Collected Amount", "Pending Amount", "Due Date", "Collection Date", "Payment Mode"};
            
            int rowIdx = 0;
            
            // Title Row
            org.apache.poi.ss.usermodel.Row titleRow = sheet.createRow(rowIdx++);
            titleRow.createCell(0).setCellValue("EVA CRM - Collection & Pending Report");
            
            // Subtitle
            org.apache.poi.ss.usermodel.Row subtitleRow = sheet.createRow(rowIdx++);
            subtitleRow.createCell(0).setCellValue("Generated on: " + java.time.LocalDateTime.now().toString());
            rowIdx++; // Blank row

            BigDecimal grandTotalCollected = BigDecimal.ZERO;
            BigDecimal grandTotalPending = BigDecimal.ZERO;

            for (Map.Entry<String, List<Customer>> entry : customersByExecutive.entrySet()) {
                String execName = entry.getKey();
                List<Customer> execCustomers = entry.getValue();

                // Executive Header Row
                org.apache.poi.ss.usermodel.Row execRow = sheet.createRow(rowIdx++);
                org.apache.poi.ss.usermodel.Cell execCell = execRow.createCell(0);
                execCell.setCellValue("Executive: " + execName);
                execCell.setCellStyle(execHeaderStyle);
                
                // Column Headers Row
                org.apache.poi.ss.usermodel.Row colHeaderRow = sheet.createRow(rowIdx++);
                for (int i = 0; i < columns.length; i++) {
                    org.apache.poi.ss.usermodel.Cell cell = colHeaderRow.createCell(i);
                    cell.setCellValue(columns[i]);
                    cell.setCellStyle(headerStyle);
                }

                BigDecimal execTotalCollected = BigDecimal.ZERO;
                BigDecimal execTotalPending = BigDecimal.ZERO;

                for (Customer c : execCustomers) {
                    List<CollectionLog> cLogs = logsByCustomerId.getOrDefault(c.getId(), Collections.emptyList());
                    BigDecimal collected = cLogs.stream()
                            .map(CollectionLog::getAmountCollected)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal pending = c.getPendingAmount() != null ? c.getPendingAmount() : c.getEmiAmount();

                    execTotalCollected = execTotalCollected.add(collected);
                    execTotalPending = execTotalPending.add(pending);

                    String collDate = "N/A";
                    String collMode = "N/A";
                    if (!cLogs.isEmpty()) {
                        CollectionLog latestLog = cLogs.stream()
                                .max((l1, l2) -> l1.getCollectedAt().compareTo(l2.getCollectedAt()))
                                .get();
                        collDate = latestLog.getCollectedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                        collMode = latestLog.getPaymentMode();
                    }

                    org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
                    row.createCell(0).setCellValue(c.getName());
                    row.createCell(1).setCellValue(c.getPhone() != null ? c.getPhone() : "-");
                    row.createCell(2).setCellValue(c.getStatus());
                    row.createCell(3).setCellValue(collected.doubleValue());
                    row.createCell(4).setCellValue(pending.doubleValue());
                    row.createCell(5).setCellValue(c.getDueDate() != null ? c.getDueDate().toString() : "-");
                    row.createCell(6).setCellValue(collDate);
                    row.createCell(7).setCellValue(collMode);
                }

                // Executive Total Row
                org.apache.poi.ss.usermodel.Row totalRow = sheet.createRow(rowIdx++);
                org.apache.poi.ss.usermodel.Cell totalLabelCell = totalRow.createCell(0);
                totalLabelCell.setCellValue("Executive Total");
                totalLabelCell.setCellStyle(totalStyle);

                org.apache.poi.ss.usermodel.Cell totalCollCell = totalRow.createCell(3);
                totalCollCell.setCellValue(execTotalCollected.doubleValue());
                totalCollCell.setCellStyle(totalStyle);

                org.apache.poi.ss.usermodel.Cell totalPendCell = totalRow.createCell(4);
                totalPendCell.setCellValue(execTotalPending.doubleValue());
                totalPendCell.setCellStyle(totalStyle);

                rowIdx++; // Blank row between executives

                grandTotalCollected = grandTotalCollected.add(execTotalCollected);
                grandTotalPending = grandTotalPending.add(execTotalPending);
            }

            // Grand Summary
            rowIdx++;
            org.apache.poi.ss.usermodel.Row gSummaryLabelRow = sheet.createRow(rowIdx++);
            org.apache.poi.ss.usermodel.Cell gSumLabel = gSummaryLabelRow.createCell(0);
            gSumLabel.setCellValue("Grand Summary");
            gSumLabel.setCellStyle(totalStyle);

            org.apache.poi.ss.usermodel.Row gCollRow = sheet.createRow(rowIdx++);
            gCollRow.createCell(0).setCellValue("Total Collected Amount");
            gCollRow.createCell(1).setCellValue(grandTotalCollected.doubleValue());

            org.apache.poi.ss.usermodel.Row gPendRow = sheet.createRow(rowIdx++);
            gPendRow.createCell(0).setCellValue("Total Pending Amount");
            gPendRow.createCell(1).setCellValue(grandTotalPending.doubleValue());

            org.apache.poi.ss.usermodel.Row gTargetRow = sheet.createRow(rowIdx++);
            gTargetRow.createCell(0).setCellValue("Total Target Amount");
            gTargetRow.createCell(1).setCellValue(grandTotalCollected.add(grandTotalPending).doubleValue());

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            logExport(admin, "COLLECTIONS", "XLSX");
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Excel Export failed", e);
            throw new IOException("Error generating Excel", e);
        }
    }

    public byte[] exportCollectionsToPdf(User admin) throws IOException {
        List<Customer> customers = customerRepository.findAll();
        List<CollectionLog> logs = collectionLogRepository.findAll();
        
        Map<Long, List<CollectionLog>> logsByCustomerId = logs.stream()
                .filter(log -> log.getCustomer() != null)
                .collect(Collectors.groupingBy(log -> log.getCustomer().getId()));

        Map<String, List<Customer>> customersByExecutive = new TreeMap<>();
        for (Customer c : customers) {
            String execName = c.getAssignedExecutive() != null 
                    ? c.getAssignedExecutive().getFullName() 
                    : "Unassigned";
            customersByExecutive.computeIfAbsent(execName, k -> new ArrayList<>()).add(c);
        }

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate()); // rotate to landscape for better space
            PdfWriter.getInstance(document, out);
            document.open();

            // Title
            com.lowagie.text.Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, Color.DARK_GRAY);
            Paragraph title = new Paragraph("EVA CRM - Collection & Pending Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            
            com.lowagie.text.Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY);
            Paragraph subtitle = new Paragraph("Generated on: " + java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")), subFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            document.add(subtitle);
            document.add(new Paragraph(" "));

            BigDecimal grandTotalCollected = BigDecimal.ZERO;
            BigDecimal grandTotalPending = BigDecimal.ZERO;

            for (Map.Entry<String, List<Customer>> entry : customersByExecutive.entrySet()) {
                String execName = entry.getKey();
                List<Customer> execCustomers = entry.getValue();

                // Executive Header
                com.lowagie.text.Font execFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, new Color(78, 205, 196));
                Paragraph execPara = new Paragraph("Executive: " + execName, execFont);
                execPara.setSpacingBefore(15f);
                execPara.setSpacingAfter(5f);
                document.add(execPara);

                 PdfPTable table = new PdfPTable(8);
                table.setWidthPercentage(100);
                table.setWidths(new float[]{20f, 12f, 10f, 12f, 12f, 12f, 12f, 10f});

                String[] headers = {"Customer", "Phone", "Status", "Collected Amt", "Pending Amt", "Due Date", "Collection Date", "Mode"};
                for (String h : headers) {
                    PdfPCell cell = new PdfPCell(new Phrase(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD)));
                    cell.setBackgroundColor(Color.LIGHT_GRAY);
                    cell.setPadding(6);
                    table.addCell(cell);
                }

                BigDecimal execTotalCollected = BigDecimal.ZERO;
                BigDecimal execTotalPending = BigDecimal.ZERO;

                for (Customer c : execCustomers) {
                    List<CollectionLog> cLogs = logsByCustomerId.getOrDefault(c.getId(), Collections.emptyList());
                    BigDecimal collected = cLogs.stream()
                            .map(CollectionLog::getAmountCollected)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal pending = c.getPendingAmount() != null ? c.getPendingAmount() : c.getEmiAmount();

                    execTotalCollected = execTotalCollected.add(collected);
                    execTotalPending = execTotalPending.add(pending);

                    String collDate = "N/A";
                    String collMode = "N/A";
                    if (!cLogs.isEmpty()) {
                        CollectionLog latestLog = cLogs.stream()
                                .max((l1, l2) -> l1.getCollectedAt().compareTo(l2.getCollectedAt()))
                                .get();
                        collDate = latestLog.getCollectedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                        collMode = latestLog.getPaymentMode();
                    }

                    table.addCell(new PdfPCell(new Phrase(c.getName(), FontFactory.getFont(FontFactory.HELVETICA, 10))));
                    table.addCell(new PdfPCell(new Phrase(c.getPhone() != null ? c.getPhone() : "-", FontFactory.getFont(FontFactory.HELVETICA, 10))));
                    table.addCell(new PdfPCell(new Phrase(c.getStatus(), FontFactory.getFont(FontFactory.HELVETICA, 10))));
                    table.addCell(new PdfPCell(new Phrase("₹" + collected.toString(), FontFactory.getFont(FontFactory.HELVETICA, 10))));
                    table.addCell(new PdfPCell(new Phrase("₹" + pending.toString(), FontFactory.getFont(FontFactory.HELVETICA, 10))));
                    table.addCell(new PdfPCell(new Phrase(c.getDueDate() != null ? c.getDueDate().toString() : "-", FontFactory.getFont(FontFactory.HELVETICA, 10))));
                    table.addCell(new PdfPCell(new Phrase(collDate, FontFactory.getFont(FontFactory.HELVETICA, 10))));
                    table.addCell(new PdfPCell(new Phrase(collMode, FontFactory.getFont(FontFactory.HELVETICA, 10))));
                }

                // Executive Total Row
                PdfPCell totalLbl = new PdfPCell(new Phrase("Executive Total", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
                totalLbl.setColspan(3);
                totalLbl.setBackgroundColor(new Color(240, 240, 240));
                totalLbl.setPadding(6);
                table.addCell(totalLbl);

                PdfPCell totalCollCell = new PdfPCell(new Phrase("₹" + execTotalCollected.toString(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
                totalCollCell.setBackgroundColor(new Color(240, 240, 240));
                totalCollCell.setPadding(6);
                table.addCell(totalCollCell);

                PdfPCell totalPendCell = new PdfPCell(new Phrase("₹" + execTotalPending.toString(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
                totalPendCell.setBackgroundColor(new Color(240, 240, 240));
                totalPendCell.setPadding(6);
                table.addCell(totalPendCell);

                for (int col = 0; col < 3; col++) {
                    PdfPCell emptyCell = new PdfPCell(new Phrase(""));
                    emptyCell.setBackgroundColor(new Color(240, 240, 240));
                    table.addCell(emptyCell);
                }

                document.add(table);

                grandTotalCollected = grandTotalCollected.add(execTotalCollected);
                grandTotalPending = grandTotalPending.add(execTotalPending);
            }

            // Grand Summary Section
            document.add(new Paragraph(" "));
            com.lowagie.text.Font summaryTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Color.DARK_GRAY);
            Paragraph sumTitle = new Paragraph("Grand Summary", summaryTitleFont);
            sumTitle.setSpacingBefore(15f);
            sumTitle.setSpacingAfter(5f);
            document.add(sumTitle);

            PdfPTable sumTable = new PdfPTable(2);
            sumTable.setWidthPercentage(40);
            sumTable.setHorizontalAlignment(Element.ALIGN_LEFT);

            sumTable.addCell(new PdfPCell(new Phrase("Total Collected Amount", FontFactory.getFont(FontFactory.HELVETICA_BOLD))));
            sumTable.addCell(new PdfPCell(new Phrase("₹" + grandTotalCollected.toString())));

            sumTable.addCell(new PdfPCell(new Phrase("Total Pending Amount", FontFactory.getFont(FontFactory.HELVETICA_BOLD))));
            sumTable.addCell(new PdfPCell(new Phrase("₹" + grandTotalPending.toString())));

            sumTable.addCell(new PdfPCell(new Phrase("Total Target Amount", FontFactory.getFont(FontFactory.HELVETICA_BOLD))));
            sumTable.addCell(new PdfPCell(new Phrase("₹" + grandTotalCollected.add(grandTotalPending).toString())));

            document.add(sumTable);

            document.close();
            logExport(admin, "COLLECTIONS", "PDF");
            return out.toByteArray();
        } catch (Exception e) {
            log.error("PDF Export failed", e);
            throw new IOException("Error generating PDF", e);
        }
    }

    public String exportCollectionsToCsv(User admin) {
        List<Customer> customers = customerRepository.findAll();
        List<CollectionLog> logs = collectionLogRepository.findAll();
        
        Map<Long, List<CollectionLog>> logsByCustomerId = logs.stream()
                .filter(log -> log.getCustomer() != null)
                .collect(Collectors.groupingBy(log -> log.getCustomer().getId()));

        Map<String, List<Customer>> customersByExecutive = new TreeMap<>();
        for (Customer c : customers) {
            String execName = c.getAssignedExecutive() != null 
                    ? c.getAssignedExecutive().getFullName() 
                    : "Unassigned";
            customersByExecutive.computeIfAbsent(execName, k -> new ArrayList<>()).add(c);
        }

        StringBuilder csv = new StringBuilder("Customer,Phone,Executive,Status,Collected Amount,Pending Amount,Due Date,Collection Date,Payment Mode\n");

        BigDecimal grandTotalCollected = BigDecimal.ZERO;
        BigDecimal grandTotalPending = BigDecimal.ZERO;

        for (Map.Entry<String, List<Customer>> entry : customersByExecutive.entrySet()) {
            String execName = entry.getKey();
            List<Customer> execCustomers = entry.getValue();

            BigDecimal execTotalCollected = BigDecimal.ZERO;
            BigDecimal execTotalPending = BigDecimal.ZERO;

            for (Customer c : execCustomers) {
                List<CollectionLog> cLogs = logsByCustomerId.getOrDefault(c.getId(), Collections.emptyList());
                BigDecimal collected = cLogs.stream()
                        .map(CollectionLog::getAmountCollected)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal pending = c.getPendingAmount() != null ? c.getPendingAmount() : c.getEmiAmount();

                execTotalCollected = execTotalCollected.add(collected);
                execTotalPending = execTotalPending.add(pending);

                String collDate = "N/A";
                String collMode = "N/A";
                if (!cLogs.isEmpty()) {
                    CollectionLog latestLog = cLogs.stream()
                            .max((l1, l2) -> l1.getCollectedAt().compareTo(l2.getCollectedAt()))
                            .get();
                    collDate = latestLog.getCollectedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                    collMode = latestLog.getPaymentMode();
                }

                // escape csv commas
                String escapedCustName = c.getName().replace(",", " ");
                String escapedExecName = execName.replace(",", " ");

                csv.append(escapedCustName).append(",")
                   .append(c.getPhone() != null ? c.getPhone() : "-").append(",")
                   .append(escapedExecName).append(",")
                   .append(c.getStatus()).append(",")
                   .append(collected).append(",")
                   .append(pending).append(",")
                   .append(c.getDueDate() != null ? c.getDueDate().toString() : "-").append(",")
                   .append(collDate).append(",")
                   .append(collMode).append("\n");
            }

            String escapedExecName = execName.replace(",", " ");
            csv.append("Executive Total,,,").append(escapedExecName).append(",")
               .append(execTotalCollected).append(",")
               .append(execTotalPending).append(",,,\n\n");

            grandTotalCollected = grandTotalCollected.add(execTotalCollected);
            grandTotalPending = grandTotalPending.add(execTotalPending);
        }

        csv.append("\nGrand Summary\n");
        csv.append("Total Collected Amount,").append(grandTotalCollected).append("\n");
        csv.append("Total Pending Amount,").append(grandTotalPending).append("\n");
        csv.append("Total Target Amount,").append(grandTotalCollected.add(grandTotalPending)).append("\n");

        logExport(admin, "COLLECTIONS", "CSV");
        return csv.toString();
    }

    public List<ExportLog> getRecentLogs() {
        return exportLogRepository.findAll();
    }

    private void logExport(User user, String type, String format) {
        ExportLog log = ExportLog.builder()
                .user(user)
                .reportType(type)
                .format(format)
                .build();
        exportLogRepository.save(log);
    }
}
