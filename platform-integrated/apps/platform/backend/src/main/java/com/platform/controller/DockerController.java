package com.platform.controller;

import com.platform.dto.ApiResponse;
import com.platform.dto.AppDTO;
import com.platform.dto.DockerContainerDTO;
import com.platform.entity.ManagedApp;
import com.platform.repository.ManagedAppRepository;
import com.platform.service.AppService;
import com.platform.service.DockerService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/docker")
@RequiredArgsConstructor
public class DockerController {

    private final DockerService dockerService;
    private final ManagedAppRepository appRepository;
    private final AppService appService;

    @GetMapping("/status")
    public ApiResponse<Map<String, Object>> getDockerStatus() {
        Map<String, Object> map = new HashMap<>();
        boolean available = dockerService.isDockerAvailable();
        map.put("available", available);
        map.put("version", dockerService.getDockerVersion());
        return ApiResponse.ok(map);
    }

    @GetMapping("/containers")
    public ApiResponse<List<DockerContainerDTO>> listContainers(@RequestParam(defaultValue = "true") boolean all) {
        List<DockerContainerDTO> containers = dockerService.listContainers(all);
        List<ManagedApp> apps = appRepository.findAll();

        for (DockerContainerDTO c : containers) {
            Optional<ManagedApp> matched = apps.stream()
                    .filter(a -> (a.getContainerName() != null && a.getContainerName().equalsIgnoreCase(c.getName())) ||
                                 (a.getContainerId() != null && c.getId().startsWith(a.getContainerId())))
                    .findFirst();

            if (matched.isPresent()) {
                c.setManaged(true);
                c.setManagedAppId(matched.get().getId());
            } else {
                c.setManaged(false);
            }
        }

        return ApiResponse.ok(containers);
    }

    @PostMapping("/containers/import")
    public ApiResponse<AppDTO> importContainer(@RequestBody ImportContainerRequest req) {
        DockerContainerDTO c = DockerContainerDTO.builder()
                .id(req.getContainerId())
                .name(req.getContainerName())
                .image(req.getImage())
                .state(req.getState())
                .build();

        AppDTO imported = appService.importDockerContainer(c, req.getAppName(), req.getCategory());
        return ApiResponse.ok("Container imported successfully", imported);
    }

    @PostMapping("/containers/{nameOrId}/start")
    public ApiResponse<Boolean> startContainer(@PathVariable String nameOrId) {
        boolean ok = dockerService.startContainer(nameOrId);
        return ApiResponse.ok(ok ? "Container started" : "Failed to start container", ok);
    }

    @PostMapping("/containers/{nameOrId}/stop")
    public ApiResponse<Boolean> stopContainer(@PathVariable String nameOrId) {
        boolean ok = dockerService.stopContainer(nameOrId);
        return ApiResponse.ok(ok ? "Container stopped" : "Failed to stop container", ok);
    }

    @PostMapping("/containers/{nameOrId}/restart")
    public ApiResponse<Boolean> restartContainer(@PathVariable String nameOrId) {
        boolean ok = dockerService.restartContainer(nameOrId);
        return ApiResponse.ok(ok ? "Container restarted" : "Failed to restart container", ok);
    }

    @DeleteMapping("/containers/{nameOrId}")
    public ApiResponse<Boolean> removeContainer(@PathVariable String nameOrId,
                                                @RequestParam(defaultValue = "false") boolean force) {
        boolean ok = dockerService.removeContainer(nameOrId, force);
        return ApiResponse.ok(ok ? "Container deleted" : "Failed to delete container", ok);
    }

    @Data
    public static class ImportContainerRequest {
        private String containerId;
        private String containerName;
        private String image;
        private String state;
        private String appName;
        private String category;
    }
}
