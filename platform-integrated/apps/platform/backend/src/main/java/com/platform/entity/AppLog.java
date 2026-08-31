package com.platform.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "app_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long appId;

    @Column(length = 100)
    private String appName;

    @Column(length = 50)
    private String action; // START, STOP, RESTART, CREATE, UPDATE, DELETE, IMPORT

    @Column(length = 30)
    private String status; // SUCCESS, FAILED, INFO

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
