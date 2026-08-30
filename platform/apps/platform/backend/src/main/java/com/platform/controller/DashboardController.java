package com.platform.controller;

import com.platform.dto.ApiResponse;
import com.platform.dto.DashboardSummaryDTO;
import com.platform.dto.DockerContainerDTO;
import com.platform.entity.ManagedApp;
import com.platform.repository.AppLogRepository;
import com.platform.repository.ManagedAppRepository;
import com.platform.service.DockerService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final ManagedAppRepository appRepository;
    private final AppLogRepository logRepository;
    private final DockerService dockerService;

    @GetMapping("/summary")
    public ApiResponse<DashboardSummaryDTO> getSummary() {
        List<ManagedApp> apps = appRepository.findAll();
        List<DockerContainerDTO> containers = dockerService.listContainers(true);

        long runningCount = apps.stream().filter(a -> "RUNNING".equalsIgnoreCase(a.getStatus())).count();
        long stoppedCount = apps.stream().filter(a -> "STOPPED".equalsIgnoreCase(a.getStatus())).count();
        long errorCount = apps.stream().filter(a -> "ERROR".equalsIgnoreCase(a.getStatus())).count();

        Map<String, Long> categoryCounts = apps.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getCategory() != null ? a.getCategory() : "OTHER",
                        Collectors.counting()
                ));

        DashboardSummaryDTO summary = DashboardSummaryDTO.builder()
                .totalApps(apps.size())
                .runningApps(runningCount)
                .stoppedApps(stoppedCount)
                .errorApps(errorCount)
                .totalContainers(containers.size())
                .dockerConnected(dockerService.isDockerAvailable())
                .dockerVersion(dockerService.getDockerVersion())
                .categoryCounts(categoryCounts)
                .recentLogs(logRepository.findTop20ByOrderByCreatedAtDesc())
                .build();

        return ApiResponse.ok(summary);
    }
}
