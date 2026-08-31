package com.platform.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "managed_apps")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManagedApp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 64)
    private String appKey;

    @Column(length = 500)
    private String description;

    @Column(length = 50)
    @Builder.Default
    private String category = "APPLICATION"; // WEB, DATABASE, QUEUE, APPLICATION, TOOL

    @Column(length = 50)
    @Builder.Default
    private String appType = "DOCKER"; // DOCKER, NATIVE

    @Column(length = 255)
    private String dockerImage;

    @Column(length = 120)
    private String containerName;

    @Column(length = 120)
    private String containerId;

    private Integer hostPort;

    private Integer containerPort;

    @Column(columnDefinition = "TEXT")
    private String envVars;

    @Column(columnDefinition = "TEXT")
    private String command;

    @Column(length = 30)
    @Builder.Default
    private String status = "STOPPED"; // RUNNING, STOPPED, STARTING, RESTARTING, ERROR, UNKNOWN

    @Column(length = 255)
    private String healthUrl;

    @Column(length = 100)
    @Builder.Default
    private String icon = "AppWindow";

    @Builder.Default
    private Boolean autoStart = false;

    @Column(length = 20)
    private String cpuLimit;

    @Column(length = 20)
    private String memoryLimit;

    private LocalDateTime lastStartedAt;

    private LocalDateTime lastStoppedAt;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = "STOPPED";
        if (category == null) category = "APPLICATION";
        if (appType == null) appType = "DOCKER";
        if (icon == null) icon = "AppWindow";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
