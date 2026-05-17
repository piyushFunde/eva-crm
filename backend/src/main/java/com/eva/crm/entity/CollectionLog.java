package com.eva.crm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "collection_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollectionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String clientGeneratedId; // For deduplication

    private String deviceId; // For auditing

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "executive_id", nullable = false)
    private User executive;

    @Column(nullable = false)
    private BigDecimal amountCollected;

    @Column(nullable = false)
    private String paymentMode; // CASH, UPI, BANK_TRANSFER

    private String notes;

    private String receiptImagePath; // Path to local storage

    private BigDecimal previousPendingAmount;
    
    private BigDecimal remainingAmount;
    
    private String statusAfterCollection;

    @Column(nullable = false, updatable = false)
    private LocalDateTime collectedAt;

    @PrePersist
    protected void onCreate() {
        collectedAt = LocalDateTime.now();
    }
}
