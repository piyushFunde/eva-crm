package com.eva.crm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "customers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String phone;

    private String address;

    @Column(nullable = false)
    private BigDecimal emiAmount;

    @Column(nullable = false)
    private LocalDate dueDate;

    @Column(nullable = false)
    private String status; // PENDING, PARTIAL, COMPLETED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "executive_id")
    private User assignedExecutive;

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<CollectionLog> collectionLogs;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
