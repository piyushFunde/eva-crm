package com.eva.crm.controller;

import com.eva.crm.dto.ApiResponse;
import com.eva.crm.dto.DashboardResponseDTO;
import com.eva.crm.entity.User;
import com.eva.crm.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<ApiResponse<DashboardResponseDTO>> getDashboard(@AuthenticationPrincipal User user) {
        DashboardResponseDTO stats;
        
        if ("ROLE_ADMIN".equals(user.getRole().name())) {
            stats = dashboardService.getAdminDashboard();
        } else {
            stats = dashboardService.getExecutiveDashboard(user);
        }

        return ResponseEntity.ok(ApiResponse.success("Dashboard stats fetched", stats));
    }
}
