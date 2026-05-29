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

        // Target = sum of all PENDING customers assigned to this executive
        // whose dueDate is on or before today (includes overdue from previous days)
        List<Customer> allAssigned = customerRepository.findAll();
        BigDecimal target = BigDecimal.ZERO;
        long assignedCount = 0;

        for (Customer c : allAssigned) {
            if (c.getAssignedExecutive() != null
                    && c.getAssignedExecutive().getId().equals(executive.getId())
                    && !c.getDueDate().isAfter(LocalDate.now())  // dueDate <= today
                    && "PENDING".equalsIgnoreCase(c.getStatus())) {
                target = target.add(c.getEmiAmount());
                assignedCount++;
            }
        }

        BigDecimal pending = target.subtract(collected);
        if (pending.compareTo(BigDecimal.ZERO) < 0) pending = BigDecimal.ZERO;

        long collectedCount = collectionLogRepository.countCollectedTodayByExecutive(executive.getId(), startOfDay);

        return DashboardResponseDTO.builder()
                .todayTarget(target)
                .todayCollected(collected)
                .todayPending(pending)
                .assignedCustomers(assignedCount)
                .todayCollectedCount(collectedCount)
                .build();
    }

    public DashboardResponseDTO getAdminDashboard() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        BigDecimal collected = collectionLogRepository.sumAmountCollectedToday(startOfDay);
        if (collected == null) collected = BigDecimal.ZERO;

        // Target = sum of all PENDING customers with dueDate <= today (includes overdue)
        List<Customer> allCustomers = customerRepository.findAll();
        BigDecimal target = BigDecimal.ZERO;
        long totalPending = 0;

        for (Customer c : allCustomers) {
            if (!c.getDueDate().isAfter(LocalDate.now())
                    && "PENDING".equalsIgnoreCase(c.getStatus())) {
                target = target.add(c.getEmiAmount());
                totalPending++;
            }
        }

        BigDecimal pending = target.subtract(collected);
        if (pending.compareTo(BigDecimal.ZERO) < 0) pending = BigDecimal.ZERO;

        return DashboardResponseDTO.builder()
                .todayTarget(target)
                .todayCollected(collected)
                .todayPending(pending)
                .assignedCustomers(totalPending)
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
                    if (c.getAssignedExecutive() != null
                            && c.getAssignedExecutive().getId().equals(exec.getId())
                            && !c.getDueDate().isAfter(LocalDate.now())
                            && "PENDING".equalsIgnoreCase(c.getStatus())) {
                        count++;
                        target = target.add(c.getEmiAmount());
                    }
                }

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
