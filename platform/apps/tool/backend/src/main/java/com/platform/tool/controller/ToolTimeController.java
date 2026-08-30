package com.platform.tool.controller;

import com.platform.tool.dto.ApiResponse;
import com.platform.tool.dto.TimeDTOs.*;
import com.platform.tool.service.ToolTimeService;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/time")
public class ToolTimeController {

    private final ToolTimeService timeService;

    public ToolTimeController(ToolTimeService timeService) {
        this.timeService = timeService;
    }

    @PostMapping("/cron-parse")
    public ApiResponse<CronParseResponse> parseCron(@RequestBody CronParseRequest req) {
        return ApiResponse.success(timeService.parseCron(req));
    }

    @GetMapping("/timestamp-now")
    public ApiResponse<Map<String, Object>> getTimestampNow() {
        long nowMs = System.currentTimeMillis();
        long nowSec = nowMs / 1000;
        LocalDateTime ldt = LocalDateTime.now();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        Map<String, Object> data = new HashMap<>();
        data.put("timestampMs", nowMs);
        data.put("timestampSec", nowSec);
        data.put("localDateTime", ldt.format(dtf));
        data.put("iso8601", Instant.now().toString());
        data.put("timeZone", ZoneId.systemDefault().getId());

        return ApiResponse.success(data);
    }
}
