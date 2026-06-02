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

    @Query("SELECT c FROM Customer c WHERE c.status != 'COMPLETED' AND c.dueDate <= :cutoffDate ORDER BY c.emiAmount DESC")
    List<Customer> findHighRiskCustomers(@org.springframework.data.repository.query.Param("cutoffDate") java.time.LocalDate cutoffDate, Pageable pageable);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM Customer c WHERE c.status = :status")
    int deleteByStatus(String status);
}
