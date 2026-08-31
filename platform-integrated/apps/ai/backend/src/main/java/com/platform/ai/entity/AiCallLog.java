package com.platform.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_call_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiCallLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "provider_key", nullable = false, length = 64)
    private String providerKey;

    @Column(name = "model_key", nullable = false, length = 100)
    private String modelKey;

    @Column(name = "call_type", nullable = false, length = 30)
    private String callType; // "CHAT", "IMAGE", "VIDEO", "AUDIO"

    @Column(name = "prompt_snippet", length = 500)
    private String promptSnippet;

    @Column(name = "response_snippet", columnDefinition = "TEXT")
    private String responseSnippet;

    @Builder.Default
    @Column(name = "tokens_prompt")
    private Integer tokensPrompt = 0;

    @Builder.Default
    @Column(name = "tokens_completion")
    private Integer tokensCompletion = 0;

    @Builder.Default
    @Column(name = "latency_ms")
    private Integer latencyMs = 0;

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String status = "SUCCESS"; // SUCCESS, FAILED

    @Column(name = "error_msg", columnDefinition = "TEXT")
    private String errorMsg;

    @Column(name = "request_json", columnDefinition = "LONGTEXT")
    private String requestJson;

    @Column(name = "response_json", columnDefinition = "LONGTEXT")
    private String responseJson;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
