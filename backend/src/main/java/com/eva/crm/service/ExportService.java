package com.eva.crm.service;

import com.eva.crm.entity.CollectionLog;
import com.eva.crm.entity.ExportLog;
import com.eva.crm.entity.User;
import com.eva.crm.repository.CollectionLogRepository;
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
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExportService {

    private final CollectionLogRepository collectionLogRepository;
    private final ExportLogRepository exportLogRepository;

    public byte[] exportCollectionsToExcel(User admin) throws IOException {
        List<CollectionLog> logs = collectionLogRepository.findAll();
        log.info("Starting Excel export for user: {}, logs count: {}", admin.getUsername(), logs.size());
        
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Collections");
            
            // Header Style
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.BLUE_GREY.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            String[] columns = {"ID", "Customer", "Executive", "Amount", "Mode", "Date", "Status"};
            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            for (int i = 0; i < columns.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (CollectionLog logEntry : logs) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(logEntry.getId());
                row.createCell(1).setCellValue(logEntry.getCustomer().getName());
                row.createCell(2).setCellValue(logEntry.getExecutive().getFullName());
                row.createCell(3).setCellValue(logEntry.getAmountCollected().doubleValue());
                row.createCell(4).setCellValue(logEntry.getPaymentMode());
                row.createCell(5).setCellValue(logEntry.getCollectedAt().toString());
                row.createCell(6).setCellValue(logEntry.getStatusAfterCollection());
            }

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
        List<CollectionLog> logs = collectionLogRepository.findAll();
        log.info("Starting PDF export for user: {}, logs count: {}", admin.getUsername(), logs.size());
        
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, out);
            document.open();

            // Header
            com.lowagie.text.Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.DARK_GRAY);
            Paragraph title = new Paragraph("EVA CRM - Collection Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph("Generated on: " + java.time.LocalDateTime.now()));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10f);

            String[] headers = {"Customer", "Exec", "Amount", "Mode", "Date", "Status"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD)));
                cell.setBackgroundColor(Color.LIGHT_GRAY);
                cell.setPadding(5);
                table.addCell(cell);
            }

            for (CollectionLog logEntry : logs) {
                table.addCell(logEntry.getCustomer().getName());
                table.addCell(logEntry.getExecutive().getFullName());
                table.addCell(logEntry.getAmountCollected().toString());
                table.addCell(logEntry.getPaymentMode());
                table.addCell(logEntry.getCollectedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
                table.addCell(logEntry.getStatusAfterCollection());
            }

            document.add(table);
            document.close();
            logExport(admin, "COLLECTIONS", "PDF");
            return out.toByteArray();
        } catch (Exception e) {
            log.error("PDF Export failed", e);
            throw new IOException("Error generating PDF", e);
        }
    }

    public String exportCollectionsToCsv(User admin) {
        List<CollectionLog> logs = collectionLogRepository.findAll();
        StringBuilder csv = new StringBuilder("ID,Customer,Executive,Amount,Mode,Date,Status\n");
        
        for (CollectionLog log : logs) {
            csv.append(log.getId()).append(",")
               .append(log.getCustomer().getName()).append(",")
               .append(log.getExecutive().getFullName()).append(",")
               .append(log.getAmountCollected()).append(",")
               .append(log.getPaymentMode()).append(",")
               .append(log.getCollectedAt()).append(",")
               .append(log.getStatusAfterCollection()).append("\n");
        }
        
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
