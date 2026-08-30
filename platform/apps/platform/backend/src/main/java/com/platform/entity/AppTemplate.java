package com.platform.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "app_templates")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 64)
    private String templateKey;

    @Column(length = 500)
    private String description;

    @Column(length = 50)
    @Builder.Default
    private String category = "DATABASE";

    @Column(nullable = false, length = 255)
    private String dockerImage;

    private Integer defaultHostPort;

    private Integer defaultContainerPort;

    @Column(columnDefinition = "TEXT")
    private String defaultEnvVars;

    @Column(columnDefinition = "TEXT")
    private String defaultCommand;

    @Column(length = 100)
    @Builder.Default
    private String icon = "Box";

    @Column(length = 255)
    private String tags;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
