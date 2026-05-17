package com.eva.crm.controller;

import com.eva.crm.dto.ApiResponse;
import com.eva.crm.dto.CustomerResponseDTO;
import com.eva.crm.entity.User;
import com.eva.crm.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CustomerResponseDTO>>> getCustomers(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        Page<CustomerResponseDTO> customers;

        // If Admin, get all customers. If Executive, get only assigned.
        if ("ROLE_ADMIN".equals(user.getRole().name())) {
            customers = customerService.getAllCustomers(page, size, search);
        } else {
            customers = customerService.getAssignedCustomers(user, page, size, search);
        }

        return ResponseEntity.ok(ApiResponse.success("Customers fetched successfully", customers));
    }
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.ok(ApiResponse.success("Customer deleted successfully", null));
    }
}
