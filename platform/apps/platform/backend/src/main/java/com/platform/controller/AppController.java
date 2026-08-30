package com.platform.controller;

import com.platform.dto.ApiResponse;
import com.platform.dto.AppDTO;
import com.platform.dto.AppStatsDTO;
import com.platform.service.AppService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/apps")
@RequiredArgsConstructor
public class AppController {

    private final AppService appService;

    @GetMapping
    public ApiResponse<List<AppDTO>> getAllApps() {
        return ApiResponse.ok(appService.getAllApps());
    }

    @GetMapping("/{id}")
    public ApiResponse<AppDTO> getAppById(@PathVariable Long id) {
        return ApiResponse.ok(appService.getAppById(id));
    }

    @PostMapping
    public ApiResponse<AppDTO> createApp(@Valid @RequestBody AppDTO dto) {
        return ApiResponse.ok("App created successfully", appService.createApp(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<AppDTO> updateApp(@PathVariable Long id, @RequestBody AppDTO dto) {
        return ApiResponse.ok("App updated successfully", appService.updateApp(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteApp(@PathVariable Long id,
                                      @RequestParam(defaultValue = "false") boolean removeContainer) {
        appService.deleteApp(id, removeContainer);
        return ApiResponse.ok("App deleted successfully", null);
    }

    @PostMapping("/{id}/start")
    public ApiResponse<AppDTO> startApp(@PathVariable Long id) {
        return ApiResponse.ok("App started successfully", appService.startApp(id));
    }

    @PostMapping("/{id}/stop")
    public ApiResponse<AppDTO> stopApp(@PathVariable Long id) {
        return ApiResponse.ok("App stopped successfully", appService.stopApp(id));
    }

    @PostMapping("/{id}/restart")
    public ApiResponse<AppDTO> restartApp(@PathVariable Long id) {
        return ApiResponse.ok("App restarted successfully", appService.restartApp(id));
    }

    @GetMapping("/{id}/logs")
    public ApiResponse<String> getAppLogs(@PathVariable Long id,
                                         @RequestParam(defaultValue = "150") int lines) {
        return ApiResponse.ok("Logs fetched successfully", appService.getAppLogs(id, lines));
    }

    @GetMapping("/{id}/stats")
    public ApiResponse<AppStatsDTO> getAppStats(@PathVariable Long id) {
        return ApiResponse.ok("Stats fetched successfully", appService.getAppStats(id));
    }
}
