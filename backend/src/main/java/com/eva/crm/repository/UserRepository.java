package com.eva.crm.repository;

import com.eva.crm.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameIgnoreCase(String username);
    java.util.List<User> findByRole(com.eva.crm.entity.Role role);
}
