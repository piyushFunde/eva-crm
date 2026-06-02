package com.eva.crm.service;

import com.eva.crm.dto.CollectionRequestDTO;
import com.eva.crm.entity.CollectionLog;
import com.eva.crm.entity.Customer;
import com.eva.crm.entity.User;
import com.eva.crm.exception.ResourceNotFoundException;
import com.eva.crm.repository.CollectionLogRepository;
import com.eva.crm.repository.CustomerRepository;
import com.eva.crm.dto.CollectionHistoryDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CollectionService {

    private final CollectionLogRepository collectionLogRepository;
    private final CustomerRepository customerRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private final String UPLOAD_DIR = "uploads/receipts/";

    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "analytics", allEntries = true)
    public void recordCollection(CollectionRequestDTO request, User executive) throws IOException {
        // Idempotency check
        if (request.getClientGeneratedId() != null && 
            collectionLogRepository.existsByClientGeneratedId(request.getClientGeneratedId())) {
            return; // Already processed
        }

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        String imagePath = null;
        if (request.getReceiptImage() != null && !request.getReceiptImage().isEmpty()) {
            imagePath = saveReceiptImage(request.getReceiptImage());
        }

        java.math.BigDecimal previousPending = customer.getEmiAmount();
        java.math.BigDecimal remaining = previousPending.subtract(request.getAmountCollected());
        String newStatus;

        if (remaining.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            newStatus = "COMPLETED";
            remaining = java.math.BigDecimal.ZERO;
        } else {
            newStatus = "PARTIAL";
        }

        CollectionLog log = CollectionLog.builder()
                .customer(customer)
                .executive(executive)
                .amountCollected(request.getAmountCollected())
                .paymentMode(request.getPaymentMode())
                .notes(request.getNotes())
                .clientGeneratedId(request.getClientGeneratedId())
                .deviceId(request.getDeviceId())
                .receiptImagePath(imagePath)
                .previousPendingAmount(previousPending)
                .remainingAmount(remaining)
                .statusAfterCollection(newStatus)
                .build();

        collectionLogRepository.save(log);

        // Update Customer Status
        customer.setStatus(newStatus);
        customer.setEmiAmount(remaining);
        customerRepository.save(customer);

        // Broadcast Live Update
        messagingTemplate.convertAndSend("/topic/collections", mapToDTO(log));
    }

    public Page<CollectionHistoryDTO> getAllCollections(int page, int size, String search) {
        if (search != null && !search.trim().isEmpty()) {
            return collectionLogRepository.searchAllCollections(search.trim(), PageRequest.of(page, size))
                    .map(this::mapToDTO);
        }
        return collectionLogRepository.findAllByOrderByCollectedAtDesc(PageRequest.of(page, size))
                .map(this::mapToDTO);
    }

    public Page<CollectionHistoryDTO> getExecutiveCollections(User executive, int page, int size, String search) {
        if (search != null && !search.trim().isEmpty()) {
            return collectionLogRepository.searchExecutiveCollections(executive.getId(), search.trim(), PageRequest.of(page, size))
                    .map(this::mapToDTO);
        }
        return collectionLogRepository.findByExecutiveIdOrderByCollectedAtDesc(executive.getId(), PageRequest.of(page, size))
                .map(this::mapToDTO);
    }

    private CollectionHistoryDTO mapToDTO(CollectionLog log) {
        return CollectionHistoryDTO.builder()
                .id(log.getId())
                .customerName(log.getCustomer().getName())
                .customerPhone(log.getCustomer().getPhone())
                .executiveName(log.getExecutive().getFullName())
                .amountCollected(log.getAmountCollected())
                .previousPendingAmount(log.getPreviousPendingAmount())
                .remainingAmount(log.getRemainingAmount())
                .paymentMode(log.getPaymentMode())
                .notes(log.getNotes())
                .receiptImagePath(log.getReceiptImagePath())
                .statusAfterCollection(log.getStatusAfterCollection())
                .collectedAt(log.getCollectedAt())
                .build();
    }

    private String saveReceiptImage(MultipartFile file) throws IOException {
        // 1. Max Size Validation (5MB limit)
        long MAX_SIZE = 5 * 1024 * 1024;
        if (file.getSize() > MAX_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum permitted limit of 5MB");
        }

        // 2. MIME Type Validation
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png") && !contentType.equals("application/pdf"))) {
            throw new IllegalArgumentException("Invalid file format. Only JPEG, PNG, and PDF receipts are allowed");
        }

        // 3. Extension Validation
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.contains("..")) {
            throw new IllegalArgumentException("Invalid file name layout detected");
        }
        
        String extension = "";
        int i = originalFilename.lastIndexOf('.');
        if (i > 0) {
            extension = originalFilename.substring(i + 1).toLowerCase();
        }
        if (!extension.equals("jpg") && !extension.equals("jpeg") && !extension.equals("png") && !extension.equals("pdf")) {
            throw new IllegalArgumentException("Invalid file extension layout detected");
        }

        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Clean filename using secure UUID prepended schema
        String cleanName = UUID.randomUUID().toString() + "_" + originalFilename.replaceAll("[^a-zA-Z0-9.-]", "_");
        Path filePath = uploadPath.resolve(cleanName);
        Files.copy(file.getInputStream(), filePath);

        return cleanName;
    }

    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "analytics", allEntries = true)
    public void deleteCollection(Long collectionId) {
        CollectionLog log = collectionLogRepository.findById(collectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Collection record not found"));

        Customer customer = log.getCustomer();

        // Revert Customer state
        customer.setEmiAmount(customer.getEmiAmount().add(log.getAmountCollected()));
        
        // Simple status reversal logic
        if (customer.getEmiAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {
            customer.setStatus(customer.getEmiAmount().compareTo(log.getPreviousPendingAmount()) >= 0 ? "PENDING" : "PARTIAL");
        }
        
        customerRepository.save(customer);

        // Delete Image if exists
        if (log.getReceiptImagePath() != null) {
            try {
                Files.deleteIfExists(Paths.get(UPLOAD_DIR).resolve(log.getReceiptImagePath()));
            } catch (IOException e) {
                System.err.println("Failed to delete receipt image: " + log.getReceiptImagePath());
            }
        }

        collectionLogRepository.delete(log);
    }
}
