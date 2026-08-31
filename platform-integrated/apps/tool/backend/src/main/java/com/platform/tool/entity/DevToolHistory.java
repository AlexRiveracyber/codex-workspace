package com.platform.tool.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "dev_tools_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DevToolHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String toolKey;

    @Column(length = 500)
    private String inputSummary;

    @Column(length = 500)
    private String outputSummary;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String paramsJson;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
