package com.eva.crm.service;

import com.eva.crm.dto.*;
import com.eva.crm.entity.Customer;
import com.eva.crm.entity.User;
import com.eva.crm.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final CollectionLogRepository collectionLogRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    @Cacheable(value = "analytics", key = "'overview'")
    public AnalyticsOverviewDTO getOverview() {
        long totalCustomers = customerRepository.count();
        BigDecimal totalPending = customerRepository.sumTotalPendingAmount();
        if (totalPending == null) totalPending = BigDecimal.ZERO;

        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        BigDecimal totalCollected = collectionLogRepository.sumAmountCollectedInRange(
                LocalDateTime.of(2000, 1, 1, 0, 0), LocalDateTime.now());
        if (totalCollected == null) totalCollected = BigDecimal.ZERO;

        BigDecimal todayCollected = collectionLogRepository.sumAmountCollectedToday(startOfDay);
        if (todayCollected == null) todayCollected = BigDecimal.ZERO;

        BigDecimal monthCollected = collectionLogRepository.sumAmountCollectedInRange(startOfMonth, LocalDateTime.now());
        if (monthCollected == null) monthCollected = BigDecimal.ZERO;

        long activeExecs = userRepository.count(); // Simplified

        BigDecimal totalTarget = totalPending.add(totalCollected);
        double successRate = totalTarget.compareTo(BigDecimal.ZERO) > 0 
                ? totalCollected.multiply(new BigDecimal(100)).divide(totalTarget, 2, RoundingMode.HALF_UP).doubleValue()
                : 0.0;

        return AnalyticsOverviewDTO.builder()
                .totalCustomers(totalCustomers)
                .totalCollected(totalCollected)
                .totalPending(totalPending)
                .todayCollections(todayCollected)
                .monthlyCollections(monthCollected)
                .successRate(successRate)
                .activeExecutives(activeExecs)
                .build();
    }

    @Cacheable(value = "analytics", key = "#range")
    public List<Map<String, Object>> getCollectionTrend(String range) {
        LocalDateTime start;
        LocalDateTime end = LocalDateTime.now();

        switch (range.toLowerCase()) {
            case "week":
                start = LocalDate.now().minusWeeks(1).atStartOfDay();
                break;
            case "month":
                start = LocalDate.now().minusMonths(1).atStartOfDay();
                break;
            default:
                start = LocalDate.now().minusDays(7).atStartOfDay();
        }

        return collectionLogRepository.getCollectionTrend(start, end).stream()
                .map(t -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("date", t.getTrendDate().toString());
                    map.put("amount", t.getAmount());
                    return map;
                }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getPaymentModeDistribution() {
        List<Object[]> results = collectionLogRepository.getPaymentModeDistribution();
        return results.stream().map(r -> {
            Map<String, Object> map = new HashMap<>();
            map.put("name", r[0]);
            map.put("value", r[1]);
            return map;
        }).collect(Collectors.toList());
    }

    public List<Customer> getHighRiskCustomers() {
        return customerRepository.findHighRiskCustomers(PageRequest.of(0, 10));
    }

    public List<Map<String, Object>> getExecutivePerformance() {
        List<User> executives = userRepository.findAll(); // Simplified filter for demo
        return executives.stream()
            .filter(u -> "ROLE_EXECUTIVE".equals(u.getRole().name()))
            .map(exec -> {
                BigDecimal collected = collectionLogRepository.sumAmountCollectedTodayByExecutive(exec.getId(), LocalDateTime.of(2000, 1, 1, 0, 0));
                if (collected == null) collected = BigDecimal.ZERO;
                
                Map<String, Object> map = new HashMap<>();
                map.put("name", exec.getFullName());
                map.put("collected", collected);
                return map;
            }).collect(Collectors.toList());
    }
}
