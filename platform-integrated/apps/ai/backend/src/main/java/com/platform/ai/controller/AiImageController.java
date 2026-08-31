package com.platform.ai.controller;

import com.platform.ai.dto.ImageGenRequestDTO;
import com.platform.ai.entity.AiGenerationTask;
import com.platform.ai.service.AiImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai/images")
@RequiredArgsConstructor
public class AiImageController {

    private final AiImageService imageService;

    @GetMapping("/tasks")
    public ResponseEntity<List<AiGenerationTask>> listTasks() {
        return ResponseEntity.ok(imageService.listTasks());
    }

    @GetMapping("/tasks/{id}")
    public ResponseEntity<AiGenerationTask> getTask(@PathVariable Long id) {
        return ResponseEntity.ok(imageService.getTask(id));
    }

    @PostMapping("/generate")
    public ResponseEntity<AiGenerationTask> generateImage(@RequestBody ImageGenRequestDTO request) {
        return ResponseEntity.ok(imageService.generateImage(request));
    }
}
