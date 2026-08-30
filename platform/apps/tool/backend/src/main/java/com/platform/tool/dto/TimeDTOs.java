package com.platform.tool.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class TimeDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CronParseRequest {
        private String cron;
        private int count = 10;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CronParseResponse {
        private boolean valid;
        private String description;
        private List<String> nextExecutions;
        private String errorMessage;
    }
}
