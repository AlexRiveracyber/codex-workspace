package com.platform.dto;

import com.platform.entity.AppLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryDTO {
    private long totalApps;
    private long runningApps;
    private long stoppedApps;
    private long errorApps;
    private long totalContainers;
    private boolean dockerConnected;
    private String dockerVersion;
    private Map<String, Long> categoryCounts;
    private List<AppLog> recentLogs;
}
