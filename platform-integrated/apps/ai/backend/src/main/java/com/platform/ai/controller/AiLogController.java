package com.platform.ai.controller;

import com.platform.ai.dto.CallStatsDTO;
import com.platform.ai.entity.AiCallLog;
import com.platform.ai.service.AiLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai/logs")
@RequiredArgsConstructor
public class AiLogController {

    private final AiLogService logService;

    @GetMapping
    public ResponseEntity<List<AiCallLog>> getRecentLogs(@RequestParam(required = false) String callType) {
        return ResponseEntity.ok(logService.getRecentLogs(callType));
    }

    @GetMapping("/stats")
    public ResponseEntity<CallStatsDTO> getStats() {
        return ResponseEntity.ok(logService.getStats());
    }
}
