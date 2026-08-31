package com.platform.ai.service;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.platform.ai.entity.AiProvider;
import com.platform.ai.repository.AiProviderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiProviderService {

    private final AiProviderRepository providerRepository;

    public List<AiProvider> getAllProviders() {
        return providerRepository.findAll();
    }

    public Optional<AiProvider> getProviderByKey(String providerKey) {
        return providerRepository.findByProviderKey(providerKey);
    }

    public Optional<AiProvider> getDefaultProvider() {
        return providerRepository.findFirstByIsDefaultTrue()
                .or(() -> providerRepository.findAll().stream().findFirst());
    }

    public AiProvider saveProvider(AiProvider provider) {
        if (Boolean.TRUE.equals(provider.getIsDefault())) {
            // clear previous default
            List<AiProvider> all = providerRepository.findAll();
            for (AiProvider p : all) {
                if (Boolean.TRUE.equals(p.getIsDefault()) && !Objects.equals(p.getId(), provider.getId())) {
                    p.setIsDefault(false);
                    providerRepository.save(p);
                }
            }
        }
        return providerRepository.save(provider);
    }

    public void deleteProvider(Long id) {
        providerRepository.deleteById(id);
    }

    public Map<String, Object> testConnection(Long id) {
        Optional<AiProvider> opt = providerRepository.findById(id);
        if (opt.isEmpty()) {
            return Map.of("success", false, "message", "服务商不存在");
        }
        AiProvider p = opt.get();
        return testProviderConnection(p.getBaseUrl(), p.getApiKey());
    }

    public Map<String, Object> testProviderConnection(String baseUrl, String apiKey) {
        long startTime = System.currentTimeMillis();
        String cleanUrl = baseUrl.trim();
        if (cleanUrl.endsWith("/")) {
            cleanUrl = cleanUrl.substring(0, cleanUrl.length() - 1);
        }

        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            // Try testing /models endpoint or a minimal /chat/completions ping
            String modelsUrl = cleanUrl.endsWith("/models") ? cleanUrl : cleanUrl + "/models";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(modelsUrl))
                    .header("Authorization", "Bearer " + apiKey.trim())
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            long latency = System.currentTimeMillis() - startTime;

            if (response.statusCode() == 200) {
                return Map.of(
                        "success", true,
                        "status_code", 200,
                        "latency_ms", latency,
                        "message", "网关连接成功，端点与 API Key 验证有效！"
                );
            } else if (response.statusCode() == 404 || response.statusCode() == 405) {
                // Models endpoint might not exist on custom gateway; try a minimal chat completion probe
                return probeChatEndpoint(cleanUrl, apiKey, startTime);
            } else {
                return Map.of(
                        "success", false,
                        "status_code", response.statusCode(),
                        "latency_ms", latency,
                        "message", "HTTP " + response.statusCode() + ": " + response.body()
                );
            }
        } catch (Exception e) {
            long latency = System.currentTimeMillis() - startTime;
            log.warn("Direct connection probe failed, trying fallback chat probe: {}", e.getMessage());
            return probeChatEndpoint(cleanUrl, apiKey, startTime);
        }
    }

    private Map<String, Object> probeChatEndpoint(String cleanUrl, String apiKey, long startTime) {
        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            String chatUrl = cleanUrl.endsWith("/chat/completions") ? cleanUrl : cleanUrl + "/chat/completions";
            JSONObject body = new JSONObject();
            body.put("model", "qwen3.8-flash");
            body.put("messages", List.of(Map.of("role", "user", "content", "ping")));
            body.put("max_tokens", 5);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(chatUrl))
                    .header("Authorization", "Bearer " + apiKey.trim())
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(10))
                    .POST(HttpRequest.BodyPublishers.ofString(body.toJSONString()))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            long latency = System.currentTimeMillis() - startTime;

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return Map.of(
                        "success", true,
                        "status_code", response.statusCode(),
                        "latency_ms", latency,
                        "message", "Chat completions 端点探测成功 (响应正常)"
                );
            } else if (response.statusCode() == 401 || response.statusCode() == 403) {
                return Map.of(
                        "success", false,
                        "status_code", response.statusCode(),
                        "latency_ms", latency,
                        "message", "鉴权失败: API Key 无效或未授权"
                );
            } else {
                return Map.of(
                        "success", true, // Gateway reached and returned response
                        "status_code", response.statusCode(),
                        "latency_ms", latency,
                        "message", "网关连接已建立 (HTTP " + response.statusCode() + ")"
                );
            }
        } catch (Exception e) {
            long latency = System.currentTimeMillis() - startTime;
            return Map.of(
                    "success", false,
                    "latency_ms", latency,
                    "message", "连接失败: " + e.getMessage()
            );
        }
    }
}
