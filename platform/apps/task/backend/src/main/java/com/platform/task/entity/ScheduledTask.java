package com.platform.task.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduledTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 64)
    private String taskKey;

    @Column(length = 50)
    @Builder.Default
    private String taskType = "SCHEDULED";

    @Column(length = 100)
    private String cronExpression;

    @Column(columnDefinition = "TEXT")
    private String command;

    @Builder.Default
    private Boolean enabled = true;

    @Column(length = 30)
    @Builder.Default
    private String lastStatus = "PENDING";

    private LocalDateTime lastRunAt;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (enabled == null) enabled = true;
        if (lastStatus == null) lastStatus = "PENDING";
    }
}
