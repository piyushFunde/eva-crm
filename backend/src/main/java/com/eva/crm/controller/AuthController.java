package com.eva.crm.controller;

import com.eva.crm.dto.ApiResponse;
import com.eva.crm.dto.AuthRequest;
import com.eva.crm.dto.AuthResponse;
import com.eva.crm.entity.User;
import com.eva.crm.security.JwtUtil;
import com.eva.crm.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest request) {
        // This will authenticate or throw AuthenticationException
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        User userDetails = (User) authentication.getPrincipal();
        return generateAuthResponse(userDetails);
    }

    @PostMapping("/quick-login")
    public ResponseEntity<ApiResponse<AuthResponse>> quickLogin(@RequestBody java.util.Map<String, String> request) {
        String username = request.get("username");
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!user.getRole().name().equals("ROLE_EXECUTIVE")) {
            throw new RuntimeException("Unauthorized: Quick login only available for staff");
        }

        return generateAuthResponse(user);
    }

    @PostMapping("/reset-admin-password")
    public ResponseEntity<ApiResponse<String>> resetAdminPassword(@RequestBody java.util.Map<String, String> request) {
        String username = request.get("username");
        String oldPassword = request.get("oldPassword"); // This can be the Current Password OR the Recovery Key
        String newPassword = request.get("newPassword");
        
        // HARDCODED MASTER RECOVERY KEY
        String MASTER_RECOVERY_KEY = "EVA-ADMIN-SAFE-2024";

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getRole().name().equals("ROLE_ADMIN")) {
            throw new RuntimeException("Unauthorized: This reset is only for administrators");
        }

        PasswordEncoder passwordEncoder = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
        
        // Check if user is using the Master Recovery Key OR their actual Current Password
        boolean isRecovery = oldPassword.equals(MASTER_RECOVERY_KEY);
        boolean isCurrentPasswordCorrect = passwordEncoder.matches(oldPassword, user.getPassword());

        if (!isRecovery && !isCurrentPasswordCorrect) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Incorrect Password or Invalid Recovery Key"));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        String msg = isRecovery ? "Admin password RECOVERED successfully" : "Admin password updated successfully";
        return ResponseEntity.ok(ApiResponse.success(msg, null));
    }

    private ResponseEntity<ApiResponse<AuthResponse>> generateAuthResponse(User userDetails) {
        String jwtToken = jwtUtil.generateToken(userDetails);
        AuthResponse authResponse = AuthResponse.builder()
                .token(jwtToken)
                .username(userDetails.getUsername())
                .fullName(userDetails.getFullName())
                .role(userDetails.getRole())
                .build();

        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }
}
