package com.platform.service;

import com.platform.entity.ManagedApp;
import com.platform.repository.ManagedAppRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppMonitorService {

    private final ManagedAppRepository appRepository;
    private final AppService appService;
    private final DockerService dockerService;

    // Check application container statuses every 15 seconds
    @Scheduled(fixedDelay = 15000)
    public void syncAllAppStatuses() {
        try {
            if (!dockerService.isDockerAvailable()) {
                return;
            }
            List<ManagedApp> apps = appRepository.findAll();
            for (ManagedApp app : apps) {
                appService.syncSingleAppStatus(app);
            }
        } catch (Exception e) {
            log.debug("Status sync error: {}", e.getMessage());
        }
    }
}
