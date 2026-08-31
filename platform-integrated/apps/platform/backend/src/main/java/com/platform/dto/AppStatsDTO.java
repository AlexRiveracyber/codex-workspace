package com.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppStatsDTO {
    private String containerId;
    private String containerName;
    private String cpuPercent;
    private String memoryUsage;
    private String memoryLimit;
    private String memoryPercent;
    private String netIO;
    private String blockIO;
    private String pids;
    private String status;
    private String uptime;
}
