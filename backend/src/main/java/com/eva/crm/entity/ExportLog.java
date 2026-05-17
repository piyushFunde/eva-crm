package com.eva.crm.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "export_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String reportType; // COLLECTIONS, CUSTOMERS, PERFORMANCE

    @Column(nullable = false)
    private String format; // PDF, XLSX, CSV

    @Column(nullable = false)
    private LocalDateTime exportedAt;

    @PrePersist
    protected void onCreate() {
        exportedAt = LocalDateTime.now();
    }
}
