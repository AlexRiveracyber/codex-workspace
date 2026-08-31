package com.platform.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_generation_tasks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiGenerationTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_type", nullable = false, length = 30)
    private String taskType; // "IMAGE", "VIDEO"

    @Column(name = "provider_key", nullable = false, length = 64)
    private String providerKey;

    @Column(name = "model_key", nullable = false, length = 100)
    private String modelKey;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String prompt;

    @Column(name = "negative_prompt", columnDefinition = "TEXT")
    private String negativePrompt;

    @Column(name = "input_image_url", columnDefinition = "TEXT")
    private String inputImageUrl;

    @Column(name = "result_url", columnDefinition = "TEXT")
    private String resultUrl;

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String status = "PENDING"; // PENDING, PROCESSING, SUCCESS, FAILED

    @Column(columnDefinition = "TEXT")
    private String parameters; // JSON format for aspect ratio, size, duration, etc.

    @Column(name = "error_msg", columnDefinition = "TEXT")
    private String errorMsg;

    @Builder.Default
    @Column(name = "duration_sec")
    private Integer durationSec = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
