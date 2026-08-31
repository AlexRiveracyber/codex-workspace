package com.platform.controller;

import com.platform.dto.ApiResponse;
import com.platform.entity.AppLog;
import com.platform.repository.AppLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
public class LogController {

    private final AppLogRepository logRepository;

    @GetMapping
    public ApiResponse<Page<AppLog>> getLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ApiResponse.ok(logRepository.findAllByOrderByCreatedAtDesc(pageable));
    }

    @GetMapping("/recent")
    public ApiResponse<List<AppLog>> getRecentLogs() {
        return ApiResponse.ok(logRepository.findTop20ByOrderByCreatedAtDesc());
    }

    @GetMapping("/app/{appId}")
    public ApiResponse<List<AppLog>> getLogsByApp(@PathVariable Long appId) {
        return ApiResponse.ok(logRepository.findByAppIdOrderByCreatedAtDesc(appId));
    }
}
