package com.platform.task.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "huifu_api_log")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HuifuApiLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "api_name", length = 128)
    private String apiName;

    @Column(name = "api_path", length = 255)
    private String apiPath;

    @Column(name = "huifu_id", length = 64)
    private String huifuId;

    @Column(name = "req_date", length = 32)
    private String reqDate;

    @Column(name = "req_seq_id", length = 64)
    private String reqSeqId;

    @Column(name = "apply_id", length = 64)
    private String applyId;

    @Column(name = "status_code", length = 32)
    private String statusCode;

    @Column(name = "resp_code", length = 32)
    private String respCode;

    @Column(name = "resp_desc", length = 512)
    private String respDesc;

    @Column(name = "request_payload", columnDefinition = "LONGTEXT")
    private String requestPayload;

    @Column(name = "response_payload", columnDefinition = "LONGTEXT")
    private String responsePayload;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "is_success")
    private Boolean isSuccess;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.isSuccess == null) this.isSuccess = false;
    }
}
