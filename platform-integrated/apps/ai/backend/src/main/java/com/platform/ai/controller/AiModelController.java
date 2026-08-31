package com.platform.ai.controller;

import com.platform.ai.entity.AiModel;
import com.platform.ai.service.AiModelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai/models")
@RequiredArgsConstructor
public class AiModelController {

    private final AiModelService modelService;

    @GetMapping
    public ResponseEntity<List<AiModel>> getModels(
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String capability,
            @RequestParam(required = false) String modelType,
            @RequestParam(required = false) Boolean enabledOnly) {
        return ResponseEntity.ok(modelService.getModels(brand, capability, modelType, enabledOnly));
    }

    @GetMapping("/{key}")
    public ResponseEntity<AiModel> getModel(@PathVariable String key) {
        return modelService.getModelByKey(key)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<AiModel> saveModel(@RequestBody AiModel model) {
        return ResponseEntity.ok(modelService.saveModel(model));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteModel(@PathVariable Long id) {
        modelService.deleteModel(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/{id}/toggle")
    public ResponseEntity<AiModel> toggleEnabled(@PathVariable Long id) {
        return ResponseEntity.ok(modelService.toggleEnabled(id));
    }
}
