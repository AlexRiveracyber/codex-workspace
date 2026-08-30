package com.platform.service;

import com.platform.dto.*;
import com.platform.entity.AppLog;
import com.platform.entity.AppTemplate;
import com.platform.entity.ManagedApp;
import com.platform.repository.AppLogRepository;
import com.platform.repository.AppTemplateRepository;
import com.platform.repository.ManagedAppRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppService {

    private final ManagedAppRepository appRepository;
    private final AppLogRepository logRepository;
    private final AppTemplateRepository templateRepository;
    private final DockerService dockerService;

    public List<AppDTO> getAllApps() {
        List<ManagedApp> apps = appRepository.findAll();
        // Sync status with actual container state in real-time
        for (ManagedApp app : apps) {
            syncSingleAppStatus(app);
        }
        return apps.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public AppDTO getAppById(Long id) {
        ManagedApp app = appRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("App not found with id: " + id));
        syncSingleAppStatus(app);
        return toDTO(app);
    }

    @Transactional
    public AppDTO createApp(AppDTO dto) {
        String appKey = StringUtils.hasText(dto.getAppKey())
                ? dto.getAppKey()
                : "app-" + UUID.randomUUID().toString().substring(0, 8);

        String containerName = StringUtils.hasText(dto.getContainerName())
                ? dto.getContainerName()
                : "platform-app-" + appKey;

        ManagedApp app = ManagedApp.builder()
                .name(dto.getName())
                .appKey(appKey)
                .description(dto.getDescription())
                .category(StringUtils.hasText(dto.getCategory()) ? dto.getCategory() : "APPLICATION")
                .appType(StringUtils.hasText(dto.getAppType()) ? dto.getAppType() : "DOCKER")
                .dockerImage(dto.getDockerImage())
                .containerName(containerName)
                .hostPort(dto.getHostPort())
                .containerPort(dto.getContainerPort())
                .envVars(dto.getEnvVars())
                .command(dto.getCommand())
                .status("STOPPED")
                .healthUrl(dto.getHealthUrl())
                .icon(StringUtils.hasText(dto.getIcon()) ? dto.getIcon() : "AppWindow")
                .autoStart(Boolean.TRUE.equals(dto.getAutoStart()))
                .cpuLimit(dto.getCpuLimit())
                .memoryLimit(dto.getMemoryLimit())
                .build();

        ManagedApp saved = appRepository.save(app);

        recordLog(saved.getId(), saved.getName(), "CREATE", "SUCCESS",
                "Created new application: " + saved.getName(), null);

        if (Boolean.TRUE.equals(dto.getAutoStart())) {
            startApp(saved.getId());
        }

        return toDTO(saved);
    }

    @Transactional
    public AppDTO updateApp(Long id, AppDTO dto) {
        ManagedApp app = appRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("App not found with id: " + id));

        app.setName(dto.getName());
        app.setDescription(dto.getDescription());
        if (StringUtils.hasText(dto.getCategory())) app.setCategory(dto.getCategory());
        if (StringUtils.hasText(dto.getDockerImage())) app.setDockerImage(dto.getDockerImage());
        if (StringUtils.hasText(dto.getContainerName())) app.setContainerName(dto.getContainerName());
        app.setHostPort(dto.getHostPort());
        app.setContainerPort(dto.getContainerPort());
        app.setEnvVars(dto.getEnvVars());
        app.setCommand(dto.getCommand());
        app.setHealthUrl(dto.getHealthUrl());
        if (StringUtils.hasText(dto.getIcon())) app.setIcon(dto.getIcon());
        app.setAutoStart(Boolean.TRUE.equals(dto.getAutoStart()));
        app.setCpuLimit(dto.getCpuLimit());
        app.setMemoryLimit(dto.getMemoryLimit());

        ManagedApp updated = appRepository.save(app);
        recordLog(updated.getId(), updated.getName(), "UPDATE", "SUCCESS",
                "Updated application configuration", null);

        return toDTO(updated);
    }

    @Transactional
    public void deleteApp(Long id, boolean removeContainer) {
        ManagedApp app = appRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("App not found with id: " + id));

        if (removeContainer && StringUtils.hasText(app.getContainerName())) {
            try {
                dockerService.removeContainer(app.getContainerName(), true);
            } catch (Exception e) {
                log.warn("Failed to remove container when deleting app: {}", e.getMessage());
            }
        }

        recordLog(app.getId(), app.getName(), "DELETE", "SUCCESS",
                "Deleted application: " + app.getName(), null);

        appRepository.delete(app);
    }

    @Transactional
    public AppDTO startApp(Long id) {
        ManagedApp app = appRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("App not found with id: " + id));

        String targetName = StringUtils.hasText(app.getContainerName()) ? app.getContainerName() : app.getAppKey();

        try {
            // Check if container exists
            String state = dockerService.getContainerState(targetName);
            if ("not_found".equalsIgnoreCase(state)) {
                // Run new container from image
                if (!StringUtils.hasText(app.getDockerImage())) {
                    throw new RuntimeException("Cannot start app without docker image or container!");
                }
                String cid = dockerService.runContainer(
                        app.getDockerImage(),
                        targetName,
                        app.getHostPort(),
                        app.getContainerPort(),
                        app.getEnvVars(),
                        app.getCommand()
                );
                app.setContainerId(cid.substring(0, Math.min(cid.length(), 12)));
            } else {
                // Container exists, start it
                boolean ok = dockerService.startContainer(targetName);
                if (!ok) {
                    throw new RuntimeException("Docker start failed for container: " + targetName);
                }
            }

            app.setStatus("RUNNING");
            app.setLastStartedAt(LocalDateTime.now());
            ManagedApp saved = appRepository.save(app);

            recordLog(saved.getId(), saved.getName(), "START", "SUCCESS",
                    "Started application successfully", null);

            return toDTO(saved);
        } catch (Exception e) {
            app.setStatus("ERROR");
            appRepository.save(app);
            recordLog(app.getId(), app.getName(), "START", "FAILED",
                    "Failed to start app: " + e.getMessage(), e.getMessage());
            throw new RuntimeException("Start app failed: " + e.getMessage());
        }
    }

    @Transactional
    public AppDTO stopApp(Long id) {
        ManagedApp app = appRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("App not found with id: " + id));

        String targetName = StringUtils.hasText(app.getContainerName()) ? app.getContainerName() : app.getAppKey();

        try {
            boolean ok = dockerService.stopContainer(targetName);
            if (!ok) {
                log.warn("Docker stop returned false for {}", targetName);
            }

            app.setStatus("STOPPED");
            app.setLastStoppedAt(LocalDateTime.now());
            ManagedApp saved = appRepository.save(app);

            recordLog(saved.getId(), saved.getName(), "STOP", "SUCCESS",
                    "Stopped application successfully", null);

            return toDTO(saved);
        } catch (Exception e) {
            recordLog(app.getId(), app.getName(), "STOP", "FAILED",
                    "Failed to stop app: " + e.getMessage(), e.getMessage());
            throw new RuntimeException("Stop app failed: " + e.getMessage());
        }
    }

    @Transactional
    public AppDTO restartApp(Long id) {
        ManagedApp app = appRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("App not found with id: " + id));

        String targetName = StringUtils.hasText(app.getContainerName()) ? app.getContainerName() : app.getAppKey();

        try {
            String state = dockerService.getContainerState(targetName);
            if ("not_found".equalsIgnoreCase(state)) {
                return startApp(id);
            }

            boolean ok = dockerService.restartContainer(targetName);
            if (!ok) {
                throw new RuntimeException("Docker restart failed for: " + targetName);
            }

            app.setStatus("RUNNING");
            app.setLastStartedAt(LocalDateTime.now());
            ManagedApp saved = appRepository.save(app);

            recordLog(saved.getId(), saved.getName(), "RESTART", "SUCCESS",
                    "Restarted application successfully", null);

            return toDTO(saved);
        } catch (Exception e) {
            app.setStatus("ERROR");
            appRepository.save(app);
            recordLog(app.getId(), app.getName(), "RESTART", "FAILED",
                    "Failed to restart app: " + e.getMessage(), e.getMessage());
            throw new RuntimeException("Restart app failed: " + e.getMessage());
        }
    }

    public String getAppLogs(Long id, int lines) {
        ManagedApp app = appRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("App not found with id: " + id));

        String targetName = StringUtils.hasText(app.getContainerName()) ? app.getContainerName() : app.getContainerId();
        if (!StringUtils.hasText(targetName)) {
            return "No container assigned to this app.";
        }
        return dockerService.getContainerLogs(targetName, lines);
    }

    public AppStatsDTO getAppStats(Long id) {
        ManagedApp app = appRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("App not found with id: " + id));

        String targetName = StringUtils.hasText(app.getContainerName()) ? app.getContainerName() : app.getContainerId();
        if (!StringUtils.hasText(targetName)) {
            return AppStatsDTO.builder().status("NO_CONTAINER").build();
        }
        return dockerService.getContainerStats(targetName);
    }

    @Transactional
    public AppDTO deployTemplate(DeployTemplateRequest req) {
        AppTemplate template = templateRepository.findByTemplateKey(req.getTemplateKey())
                .orElseThrow(() -> new IllegalArgumentException("Template not found: " + req.getTemplateKey()));

        String appKey = "app-" + UUID.randomUUID().toString().substring(0, 8);
        String containerName = StringUtils.hasText(req.getContainerName())
                ? req.getContainerName()
                : "platform-" + template.getTemplateKey() + "-" + appKey.substring(4);

        int hostPort = req.getHostPort() != null ? req.getHostPort() : (template.getDefaultHostPort() != null ? template.getDefaultHostPort() : 0);
        String envs = StringUtils.hasText(req.getEnvVars()) ? req.getEnvVars() : template.getDefaultEnvVars();

        ManagedApp app = ManagedApp.builder()
                .name(req.getAppName())
                .appKey(appKey)
                .description(template.getDescription())
                .category(template.getCategory())
                .appType("DOCKER")
                .dockerImage(template.getDockerImage())
                .containerName(containerName)
                .hostPort(hostPort > 0 ? hostPort : null)
                .containerPort(template.getDefaultContainerPort())
                .envVars(envs)
                .command(template.getDefaultCommand())
                .status("STOPPED")
                .icon(template.getIcon())
                .autoStart(Boolean.TRUE.equals(req.getStartImmediately()))
                .build();

        ManagedApp saved = appRepository.save(app);

        recordLog(saved.getId(), saved.getName(), "DEPLOY", "SUCCESS",
                "Deployed from template: " + template.getName(), null);

        if (Boolean.TRUE.equals(req.getStartImmediately())) {
            startApp(saved.getId());
        }

        return toDTO(saved);
    }

    @Transactional
    public AppDTO importDockerContainer(DockerContainerDTO containerDTO, String appName, String category) {
        Optional<ManagedApp> existing = appRepository.findByContainerName(containerDTO.getName());
        if (existing.isPresent()) {
            return toDTO(existing.get());
        }

        String appKey = "import-" + UUID.randomUUID().toString().substring(0, 8);
        String status = "running".equalsIgnoreCase(containerDTO.getState()) ? "RUNNING" : "STOPPED";

        ManagedApp app = ManagedApp.builder()
                .name(StringUtils.hasText(appName) ? appName : containerDTO.getName())
                .appKey(appKey)
                .description("Imported from existing Docker container (" + containerDTO.getImage() + ")")
                .category(StringUtils.hasText(category) ? category : "APPLICATION")
                .appType("DOCKER")
                .dockerImage(containerDTO.getImage())
                .containerName(containerDTO.getName())
                .containerId(containerDTO.getId())
                .status(status)
                .icon("Layers")
                .build();

        ManagedApp saved = appRepository.save(app);
        recordLog(saved.getId(), saved.getName(), "IMPORT", "SUCCESS",
                "Imported container " + containerDTO.getName() + " to platform management", null);

        return toDTO(saved);
    }

    public void syncSingleAppStatus(ManagedApp app) {
        String targetName = StringUtils.hasText(app.getContainerName()) ? app.getContainerName() : app.getContainerId();
        if (StringUtils.hasText(targetName)) {
            String state = dockerService.getContainerState(targetName);
            if ("running".equalsIgnoreCase(state)) {
                app.setStatus("RUNNING");
            } else if ("exited".equalsIgnoreCase(state) || "stopped".equalsIgnoreCase(state)) {
                app.setStatus("STOPPED");
            } else if ("not_found".equalsIgnoreCase(state)) {
                if (!"ERROR".equalsIgnoreCase(app.getStatus())) {
                    app.setStatus("STOPPED");
                }
            }
            appRepository.save(app);
        }
    }

    private void recordLog(Long appId, String appName, String action, String status, String message, String details) {
        try {
            AppLog appLog = AppLog.builder()
                    .appId(appId)
                    .appName(appName)
                    .action(action)
                    .status(status)
                    .message(message)
                    .details(details)
                    .build();
            logRepository.save(appLog);
        } catch (Exception e) {
            log.warn("Failed to record app log: {}", e.getMessage());
        }
    }

    private AppDTO toDTO(ManagedApp entity) {
        return AppDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .appKey(entity.getAppKey())
                .description(entity.getDescription())
                .category(entity.getCategory())
                .appType(entity.getAppType())
                .dockerImage(entity.getDockerImage())
                .containerName(entity.getContainerName())
                .containerId(entity.getContainerId())
                .hostPort(entity.getHostPort())
                .containerPort(entity.getContainerPort())
                .envVars(entity.getEnvVars())
                .command(entity.getCommand())
                .status(entity.getStatus())
                .healthUrl(entity.getHealthUrl())
                .icon(entity.getIcon())
                .autoStart(entity.getAutoStart())
                .cpuLimit(entity.getCpuLimit())
                .memoryLimit(entity.getMemoryLimit())
                .lastStartedAt(entity.getLastStartedAt())
                .lastStoppedAt(entity.getLastStoppedAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
