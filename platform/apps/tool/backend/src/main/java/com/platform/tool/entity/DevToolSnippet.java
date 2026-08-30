package com.platform.tool.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "dev_tools_snippets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DevToolSnippet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 50)
    @Builder.Default
    private String category = "GENERAL";

    @Column(length = 50)
    @Builder.Default
    private String language = "plaintext";

    @Lob
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String codeContent;

    @Column(length = 500)
    private String description;

    @Column(length = 255)
    private String tags;

    @Builder.Default
    private Boolean isPinned = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
