package com.platform.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "conversation_id", nullable = false)
    private Long conversationId;

    @Column(nullable = false, length = 30)
    private String role; // "user", "assistant", "system"

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String content;

    @Column(columnDefinition = "LONGTEXT")
    private String thinking; // reasoning content / thought chain

    @Column(name = "image_urls", columnDefinition = "TEXT")
    private String imageUrls; // comma separated or JSON array of image URLs

    @Column(name = "video_urls", columnDefinition = "TEXT")
    private String videoUrls; // generated video URLs

    @Column(name = "audio_urls", columnDefinition = "TEXT")
    private String audioUrls; // generated audio URLs

    @Builder.Default
    @Column(name = "media_type", length = 30)
    private String mediaType = "TEXT"; // "TEXT", "IMAGE", "VIDEO", "AUDIO"

    @Builder.Default
    @Column(name = "tokens_used")
    private Integer tokensUsed = 0;

    @Builder.Default
    @Column(name = "latency_ms")
    private Integer latencyMs = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
