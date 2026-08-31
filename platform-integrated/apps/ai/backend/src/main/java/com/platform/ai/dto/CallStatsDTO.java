package com.platform.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CallStatsDTO {
    private Long totalCalls;
    private Long successCalls;
    private Double successRate;
    private Long totalTokens;
    private Double avgLatencyMs;
    private Long totalModels;
    private Long totalProviders;
}
