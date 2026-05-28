package com.eva.crm.service;

import com.eva.crm.dto.UserCreateDTO;
import com.eva.crm.entity.Role;
import com.eva.crm.entity.User;
import com.eva.crm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.eva.crm.repository.CustomerRepository customerRepository;

    public List<User> getAllExecutives() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ROLE_EXECUTIVE)
                .toList();
    }

    public User createExecutive(UserCreateDTO dto) {
        if (userRepository.findByUsername(dto.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        User user = User.builder()
                .fullName(dto.getFullName())
                .username(dto.getUsername())
                .password(passwordEncoder.encode(dto.getPassword()))
                .role(Role.ROLE_EXECUTIVE)
                .active(true)
                .build();

        return userRepository.save(user);
    }

    @org.springframework.transaction.annotation.Transactional
    public void changePassword(User user, String oldPassword, String newPassword) {
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteUser(Long id) {
        // 1. Unassign all customers from this user
        List<com.eva.crm.entity.Customer> customers = customerRepository.findAll();
        for (com.eva.crm.entity.Customer c : customers) {
            if (c.getAssignedExecutive() != null && c.getAssignedExecutive().getId().equals(id)) {
                c.setAssignedExecutive(null);
                customerRepository.save(c);
            }
        }
        
        // 2. Now delete the user
        userRepository.deleteById(id);
    }
}
