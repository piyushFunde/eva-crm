package com.eva.crm.controller;

import com.eva.crm.dto.AnalyticsOverviewDTO;
import com.eva.crm.dto.ApiResponse;
import com.eva.crm.dto.TrendDataDTO;
import com.eva.crm.entity.Customer;
import com.eva.crm.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<AnalyticsOverviewDTO>> getOverview() {
        return ResponseEntity.ok(ApiResponse.success("Overview stats fetched", analyticsService.getOverview()));
    }

    @GetMapping("/trend")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTrend(@RequestParam(defaultValue = "week") String range) {
        return ResponseEntity.ok(ApiResponse.success("Trend data fetched", analyticsService.getCollectionTrend(range)));
    }

    @GetMapping("/payment-modes")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPaymentModes() {
        return ResponseEntity.ok(ApiResponse.success("Payment mode distribution fetched", analyticsService.getPaymentModeDistribution()));
    }

    @GetMapping("/high-risk")
    public ResponseEntity<ApiResponse<List<Customer>>> getHighRisk() {
        return ResponseEntity.ok(ApiResponse.success("High risk customers fetched", analyticsService.getHighRiskCustomers()));
    }

    @GetMapping("/high-risk-debug")
    public ResponseEntity<?> getHighRiskDebug() {
        try {
            return ResponseEntity.ok(analyticsService.getHighRiskCustomers());
        } catch (Exception e) {
            java.io.StringWriter sw = new java.io.StringWriter();
            java.io.PrintWriter pw = new java.io.PrintWriter(sw);
            e.printStackTrace(pw);
            return ResponseEntity.internalServerError().body(sw.toString());
        }
    }

    @GetMapping("/performance")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPerformance() {
        return ResponseEntity.ok(ApiResponse.success("Performance data fetched", analyticsService.getExecutivePerformance()));
    }
}
