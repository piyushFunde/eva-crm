package com.eva.crm.service;

import com.eva.crm.dto.CustomerResponseDTO;
import com.eva.crm.entity.Customer;
import com.eva.crm.entity.User;
import com.eva.crm.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;

    public Page<CustomerResponseDTO> getAssignedCustomers(User executive, int page, int size, String search) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<Customer> customers;

        if (search != null && !search.isEmpty()) {
            customers = customerRepository.findByNameContainingIgnoreCaseAndAssignedExecutiveId(search, executive.getId(), pageRequest);
        } else {
            customers = customerRepository.findByAssignedExecutiveId(executive.getId(), pageRequest);
        }

        return customers.map(this::mapToDTO);
    }

    public Page<CustomerResponseDTO> getAllCustomers(int page, int size, String search) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<Customer> customers;

        if (search != null && !search.isEmpty()) {
            customers = customerRepository.findByNameContainingIgnoreCase(search, pageRequest);
        } else {
            customers = customerRepository.findAll(pageRequest);
        }

        return customers.map(this::mapToDTO);
    }

    @org.springframework.cache.annotation.CacheEvict(value = "analytics", allEntries = true)
    public void deleteCustomer(Long id) {
        customerRepository.deleteById(id);
    }

    private CustomerResponseDTO mapToDTO(Customer customer) {
        return CustomerResponseDTO.builder()
                .id(customer.getId())
                .name(customer.getName())
                .phone(customer.getPhone())
                .address(customer.getAddress())
                .emiAmount(customer.getEmiAmount())
                .dueDate(customer.getDueDate())
                .status(customer.getStatus())
                .executiveId(customer.getAssignedExecutive() != null ? customer.getAssignedExecutive().getId() : null)
                .executiveName(customer.getAssignedExecutive() != null ? customer.getAssignedExecutive().getFullName() : "Unassigned")
                .build();
    }
}
