package com.eva.crm.repository;

import com.eva.crm.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Page<Customer> findByAssignedExecutiveId(Long executiveId, Pageable pageable);
    Page<Customer> findByNameContainingIgnoreCaseAndAssignedExecutiveId(String name, Long executiveId, Pageable pageable);
    Page<Customer> findByNameContainingIgnoreCase(String name, Pageable pageable);

    @Query("SELECT SUM(c.emiAmount) FROM Customer c")
    BigDecimal sumTotalPendingAmount();

    @Query("SELECT c FROM Customer c WHERE c.emiAmount > 10000 AND c.status != 'COMPLETED' ORDER BY c.emiAmount DESC")
    List<Customer> findHighRiskCustomers(Pageable pageable);
}
