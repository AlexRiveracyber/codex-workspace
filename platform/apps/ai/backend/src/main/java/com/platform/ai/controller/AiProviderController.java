package com.platform.ai.controller;

import com.platform.ai.entity.AiProvider;
import com.platform.ai.service.AiProviderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai/providers")
@RequiredArgsConstructor
public class AiProviderController {

    private final AiProviderService providerService;

    @GetMapping
    public ResponseEntity<List<AiProvider>> getProviders() {
        return ResponseEntity.ok(providerService.getAllProviders());
    }

    @PostMapping
    public ResponseEntity<AiProvider> saveProvider(@RequestBody AiProvider provider) {
        return ResponseEntity.ok(providerService.saveProvider(provider));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteProvider(@PathVariable Long id) {
        providerService.deleteProvider(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/{id}/test")
    public ResponseEntity<Map<String, Object>> testConnection(@PathVariable Long id) {
        return ResponseEntity.ok(providerService.testConnection(id));
    }

    @PostMapping("/test-custom")
    public ResponseEntity<Map<String, Object>> testCustomConnection(@RequestBody Map<String, String> body) {
        String baseUrl = body.getOrDefault("base_url", "");
        String apiKey = body.getOrDefault("api_key", "");
        return ResponseEntity.ok(providerService.testProviderConnection(baseUrl, apiKey));
    }
}
