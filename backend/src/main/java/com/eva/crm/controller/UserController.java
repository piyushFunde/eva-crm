package com.eva.crm.controller;

import com.eva.crm.dto.ApiResponse;
import com.eva.crm.entity.User;
import com.eva.crm.repository.UserRepository;
import com.eva.crm.service.UserService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody PasswordChangeRequest request) {
        
        try {
            User user = userRepository.findByUsername(principal.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            userService.changePassword(user, request.getOldPassword(), request.getNewPassword());
            return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @Data
    public static class PasswordChangeRequest {
        private String oldPassword;
        private String newPassword;
    }
}
