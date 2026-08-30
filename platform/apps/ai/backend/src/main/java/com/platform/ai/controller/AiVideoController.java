package com.platform.ai.controller;

import com.platform.ai.dto.VideoGenRequestDTO;
import com.platform.ai.entity.AiGenerationTask;
import com.platform.ai.service.AiVideoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai/videos")
@RequiredArgsConstructor
public class AiVideoController {

    private final AiVideoService videoService;

    @GetMapping("/tasks")
    public ResponseEntity<List<AiGenerationTask>> listTasks() {
        return ResponseEntity.ok(videoService.listTasks());
    }

    @GetMapping("/tasks/{id}")
    public ResponseEntity<AiGenerationTask> getTask(@PathVariable Long id) {
        return ResponseEntity.ok(videoService.getTask(id));
    }

    @PostMapping("/generate")
    public ResponseEntity<AiGenerationTask> generateVideo(@RequestBody VideoGenRequestDTO request) {
        return ResponseEntity.ok(videoService.generateVideo(request));
    }
}
