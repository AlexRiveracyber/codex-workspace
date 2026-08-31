package com.platform.task.controller;

import com.platform.task.entity.ScheduledTask;
import com.platform.task.repository.ScheduledTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class TaskController {

    private final ScheduledTaskRepository taskRepository;

    @GetMapping
    public ResponseEntity<List<ScheduledTask>> getAllTasks() {
        return ResponseEntity.ok(taskRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<ScheduledTask> createTask(@RequestBody ScheduledTask task) {
        if (task.getTaskKey() == null || task.getTaskKey().isEmpty()) {
            task.setTaskKey("task-" + UUID.randomUUID().toString().substring(0, 8));
        }
        return ResponseEntity.ok(taskRepository.save(task));
    }

    @PostMapping("/{id}/trigger")
    public ResponseEntity<Map<String, Object>> triggerTask(@PathVariable Long id) {
        ScheduledTask task = taskRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        task.setLastRunAt(LocalDateTime.now());
        task.setLastStatus("SUCCESS");
        taskRepository.save(task);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Task " + task.getName() + " triggered successfully",
                "taskId", task.getId()
        ));
    }

    @PostMapping("/{id}/toggle")
    public ResponseEntity<ScheduledTask> toggleTask(@PathVariable Long id) {
        ScheduledTask task = taskRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        task.setEnabled(!Boolean.TRUE.equals(task.getEnabled()));
        return ResponseEntity.ok(taskRepository.save(task));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
