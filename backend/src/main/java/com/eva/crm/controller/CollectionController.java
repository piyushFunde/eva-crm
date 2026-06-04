package com.eva.crm.controller;

import com.eva.crm.dto.ApiResponse;
import com.eva.crm.dto.CollectionRequestDTO;
import com.eva.crm.entity.User;
import com.eva.crm.service.CollectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.eva.crm.dto.CollectionHistoryDTO;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/collections")
@RequiredArgsConstructor
public class CollectionController {

    private final CollectionService collectionService;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> recordCollection(
            @AuthenticationPrincipal User user,
            @Valid @ModelAttribute CollectionRequestDTO request) {
        
        try {
            collectionService.recordCollection(request, user);
            return ResponseEntity.ok(ApiResponse.success("Collection recorded successfully", null));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to save receipt image"));
        }
    }

    @GetMapping("/my-history")
    public ResponseEntity<ApiResponse<Page<CollectionHistoryDTO>>> getMyHistory(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String search) {
        
        Page<CollectionHistoryDTO> history = collectionService.getExecutiveCollections(user, page, size, search);
        return ResponseEntity.ok(ApiResponse.success("History fetched successfully", history));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<Page<CollectionHistoryDTO>>> getAllHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String search) {
        
        Page<CollectionHistoryDTO> history = collectionService.getAllCollections(page, size, search);
        return ResponseEntity.ok(ApiResponse.success("History fetched successfully", history));
    }
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCollection(@PathVariable Long id) {
        collectionService.deleteCollection(id);
        return ResponseEntity.ok(ApiResponse.success("Collection deleted and customer state reverted", null));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/customer/{customerId}/latest")
    public ResponseEntity<ApiResponse<Void>> deleteLatestCollectionForCustomer(@PathVariable Long customerId) {
        collectionService.deleteLatestCollectionForCustomer(customerId);
        return ResponseEntity.ok(ApiResponse.success("Latest collection reverted successfully", null));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/customer/{customerId}/latest/edit")
    public ResponseEntity<ApiResponse<Void>> editLatestCollectionForCustomer(
            @PathVariable Long customerId,
            @RequestParam java.math.BigDecimal amount) {
        collectionService.editLatestCollectionForCustomer(customerId, amount);
        return ResponseEntity.ok(ApiResponse.success("Latest collection edited successfully", null));
    }
}
