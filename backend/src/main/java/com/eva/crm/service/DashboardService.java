package com.eva.crm.service;

import com.eva.crm.dto.DashboardResponseDTO;
import com.eva.crm.dto.TeamPerformanceDTO;
import com.eva.crm.entity.Customer;
import com.eva.crm.entity.User;
import com.eva.crm.repository.UserRepository;
import com.eva.crm.repository.CollectionLogRepository;
import com.eva.crm.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final CollectionLogRepository collectionLogRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    public DashboardResponseDTO getExecutiveDashboard(User executive) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        
        BigDecimal collected = collectionLogRepository.sumAmountCollectedTodayByExecutive(executive.getId(), startOfDay);
        if (collected == null) collected = BigDecimal.ZERO;

        // Calculate Target based on DUE customers assigned to executive
        List<Customer> allAssigned = customerRepository.findAll(); // Simplified for now
        BigDecimal target = BigDecimal.ZERO;
        for (Customer c : allAssigned) {
            if (c.getAssignedExecutive() != null && c.getAssignedExecutive().getId().equals(executive.getId()) 
                    && c.getDueDate().isEqual(LocalDate.now())) {
                target = target.add(c.getEmiAmount());
            }
        }

        BigDecimal pending = target.subtract(collected);
        if (pending.compareTo(BigDecimal.ZERO) < 0) pending = BigDecimal.ZERO;

        return DashboardResponseDTO.builder()
                .todayTarget(target)
                .todayCollected(collected)
                .todayPending(pending)
                .build();
    }

    public DashboardResponseDTO getAdminDashboard() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        
        BigDecimal collected = collectionLogRepository.sumAmountCollectedToday(startOfDay);
        if (collected == null) collected = BigDecimal.ZERO;

        List<Customer> allCustomers = customerRepository.findAll();
        BigDecimal target = BigDecimal.ZERO;
        for (Customer c : allCustomers) {
            if (c.getDueDate().isEqual(LocalDate.now())) {
                target = target.add(c.getEmiAmount());
            }
        }

        BigDecimal pending = target.subtract(collected);
        if (pending.compareTo(BigDecimal.ZERO) < 0) pending = BigDecimal.ZERO;

        return DashboardResponseDTO.builder()
                .todayTarget(target)
                .todayCollected(collected)
                .todayPending(pending)
                .build();
    }

    public List<TeamPerformanceDTO> getTeamPerformance() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        List<User> executives = userRepository.findAll();
        
        return executives.stream()
            .filter(u -> "ROLE_EXECUTIVE".equals(u.getRole().name()) || "EXECUTIVE".equals(u.getRole().name()))
            .map(exec -> {
                BigDecimal collected = collectionLogRepository.sumAmountCollectedTodayByExecutive(exec.getId(), startOfDay);
                if (collected == null) collected = BigDecimal.ZERO;
                
                List<Customer> allCustomers = customerRepository.findAll();
                BigDecimal target = BigDecimal.ZERO;
                long count = 0;
                
                for (Customer c : allCustomers) {
                    if (c.getAssignedExecutive() != null && c.getAssignedExecutive().getId().equals(exec.getId())) {
                        count++;
                        // Target is sum of all emiAmounts (total pending) + collected today
                        target = target.add(c.getEmiAmount());
                    }
                }
                
                target = target.add(collected); // Real total target including what was collected

                return TeamPerformanceDTO.builder()
                        .executiveId(exec.getId())
                        .name(exec.getFullName())
                        .customers(count)
                        .target(target)
                        .collected(collected)
                        .build();
            }).toList();
    }
}
