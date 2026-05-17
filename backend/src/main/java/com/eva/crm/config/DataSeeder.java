package com.eva.crm.config;

import com.eva.crm.entity.Role;
import com.eva.crm.entity.User;
import com.eva.crm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            String defaultAdminPassword = System.getenv("DEFAULT_ADMIN_PASSWORD");
            if (defaultAdminPassword == null || defaultAdminPassword.trim().isEmpty()) {
                defaultAdminPassword = "admin123";
            }
            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode(defaultAdminPassword))
                    .fullName("System Admin")
                    .role(Role.ROLE_ADMIN)
                    .build();
            userRepository.save(admin);
            System.out.println("✅ Default Admin user seeded successfully");
        }
    }
}
