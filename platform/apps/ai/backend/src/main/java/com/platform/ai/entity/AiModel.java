package com.platform.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_models")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "provider_key", nullable = false, length = 64)
    private String providerKey;

    @Column(nullable = false, length = 64)
    private String brand;

    @Column(name = "model_name", nullable = false, length = 100)
    private String modelName;

    @Column(name = "model_key", nullable = false, unique = true, length = 100)
    private String modelKey;

    @Column(nullable = false)
    private String capabilities;

    @Builder.Default
    @Column(name = "model_type", length = 30)
    private String modelType = "CHAT"; // CHAT, IMAGE, VIDEO, AUDIO

    @Column(length = 50)
    private String tag; // e.g., "New", "限时夜间5折"

    @Builder.Default
    @Column(name = "context_length")
    private Integer contextLength = 32768;

    @Builder.Default
    @Column(nullable = false)
    private Boolean enabled = true;

    @Builder.Default
    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
