package com.platform.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppDTO {

    private Long id;

    @NotBlank(message = "App name is required")
    private String name;

    private String appKey;

    private String description;

    private String category; // WEB, DATABASE, QUEUE, APPLICATION, TOOL

    private String appType; // DOCKER, NATIVE

    private String dockerImage;

    private String containerName;

    private String containerId;

    private Integer hostPort;

    private Integer containerPort;

    private String envVars;

    private String command;

    private String status; // RUNNING, STOPPED, STARTING, RESTARTING, ERROR, UNKNOWN

    private String healthUrl;

    private String icon;

    private Boolean autoStart;

    private String cpuLimit;

    private String memoryLimit;

    private LocalDateTime lastStartedAt;

    private LocalDateTime lastStoppedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
