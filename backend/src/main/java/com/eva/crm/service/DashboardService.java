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

        List<Long> activeTodayCustomerIds = collectionLogRepository.findCustomerIdsWithCollectionsTodayByExecutive(executive.getId(), startOfDay);

        List<Customer> allAssigned = customerRepository.findAll();
        BigDecimal pending = BigDecimal.ZERO;
        long assignedCount = 0;

        for (Customer c : allAssigned) {
            if (c.getAssignedExecutive() != null
                    && c.getAssignedExecutive().getId().equals(executive.getId())
                    && !c.getDueDate().isAfter(LocalDate.now())) {
                if (!"COMPLETED".equalsIgnoreCase(c.getStatus())) {
                    pending = pending.add(c.getPendingAmount() != null ? c.getPendingAmount() : c.getEmiAmount());
                    assignedCount++;
                } else if (activeTodayCustomerIds.contains(c.getId())) {
                    assignedCount++;
                }
            }
        }

        BigDecimal target = collected.add(pending);
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

        List<Long> activeTodayCustomerIds = collectionLogRepository.findCustomerIdsWithCollectionsToday(startOfDay);

        List<Customer> allCustomers = customerRepository.findAll();
        BigDecimal pending = BigDecimal.ZERO;
        long totalPending = 0;

        for (Customer c : allCustomers) {
            if (!c.getDueDate().isAfter(LocalDate.now())) {
                if (!"COMPLETED".equalsIgnoreCase(c.getStatus())) {
                    pending = pending.add(c.getPendingAmount() != null ? c.getPendingAmount() : c.getEmiAmount());
                    totalPending++;
                } else if (activeTodayCustomerIds.contains(c.getId())) {
                    totalPending++;
                }
            }
        }

        BigDecimal target = collected.add(pending);

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

                List<Long> activeTodayCustomerIds = collectionLogRepository.findCustomerIdsWithCollectionsTodayByExecutive(exec.getId(), startOfDay);

                List<Customer> allCustomers = customerRepository.findAll();
                BigDecimal pending = BigDecimal.ZERO;
                long count = 0;

                for (Customer c : allCustomers) {
                    if (c.getAssignedExecutive() != null
                            && c.getAssignedExecutive().getId().equals(exec.getId())
                            && !c.getDueDate().isAfter(LocalDate.now())) {
                        if (!"COMPLETED".equalsIgnoreCase(c.getStatus())) {
                            pending = pending.add(c.getPendingAmount() != null ? c.getPendingAmount() : c.getEmiAmount());
                            count++;
                        } else if (activeTodayCustomerIds.contains(c.getId())) {
                            count++;
                        }
                    }
                }

                BigDecimal target = collected.add(pending);

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
