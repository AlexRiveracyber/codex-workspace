package com.platform.ai.service;

import com.platform.ai.dto.CallStatsDTO;
import com.platform.ai.entity.AiCallLog;
import com.platform.ai.repository.AiCallLogRepository;
import com.platform.ai.repository.AiModelRepository;
import com.platform.ai.repository.AiProviderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiLogService {

    private final AiCallLogRepository logRepository;
    private final AiModelRepository modelRepository;
    private final AiProviderRepository providerRepository;

    public void logCall(String providerKey, String modelKey, String callType,
                        String promptSnippet, String responseSnippet,
                        int tokensPrompt, int tokensCompletion, int latencyMs,
                        String status, String errorMsg, String requestJson, String responseJson) {
        try {
            AiCallLog callLog = AiCallLog.builder()
                    .providerKey(providerKey)
                    .modelKey(modelKey)
                    .callType(callType)
                    .promptSnippet(promptSnippet != null && promptSnippet.length() > 500 ? promptSnippet.substring(0, 497) + "..." : promptSnippet)
                    .responseSnippet(responseSnippet)
                    .tokensPrompt(tokensPrompt)
                    .tokensCompletion(tokensCompletion)
                    .latencyMs(latencyMs)
                    .status(status)
                    .errorMsg(errorMsg)
                    .requestJson(requestJson)
                    .responseJson(responseJson)
                    .build();
            logRepository.save(callLog);
        } catch (Exception e) {
            log.error("Failed to save AI call log: {}", e.getMessage(), e);
        }
    }

    public List<AiCallLog> getRecentLogs(String callType) {
        if (callType != null && !callType.isBlank()) {
            return logRepository.findByCallTypeOrderByCreatedAtDesc(callType.trim().toUpperCase());
        }
        return logRepository.findTop100ByOrderByCreatedAtDesc();
    }

    public CallStatsDTO getStats() {
        long totalCalls = logRepository.countTotalCalls();
        long successCalls = logRepository.countSuccessCalls();
        long totalTokens = logRepository.sumTotalTokens();
        double avgLatency = logRepository.avgLatencyMs();
        long totalModels = modelRepository.count();
        long totalProviders = providerRepository.count();

        double successRate = totalCalls > 0 ? (double) successCalls / totalCalls * 100 : 100.0;

        return CallStatsDTO.builder()
                .totalCalls(totalCalls)
                .successCalls(successCalls)
                .successRate(Math.round(successRate * 10.0) / 10.0)
                .totalTokens(totalTokens)
                .avgLatencyMs(Math.round(avgLatency * 10.0) / 10.0)
                .totalModels(totalModels)
                .totalProviders(totalProviders)
                .build();
    }
}
