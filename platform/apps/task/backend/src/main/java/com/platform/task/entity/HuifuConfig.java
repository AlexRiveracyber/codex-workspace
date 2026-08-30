package com.platform.task.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "huifu_config")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HuifuConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "config_name", length = 64)
    private String configName;

    @Column(name = "sys_id", length = 64)
    private String sysId;

    @Column(name = "product_id", length = 64)
    private String productId;

    @Column(name = "rsa_merch_private_key", columnDefinition = "TEXT")
    private String rsaMerchPrivateKey;

    @Column(name = "rsa_huifu_public_key", columnDefinition = "TEXT")
    private String rsaHuifuPublicKey;

    @Column(name = "is_prod")
    private Boolean isProd;

    @Column(name = "is_default")
    private Boolean isDefault;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.isProd == null) this.isProd = true; // 默认为生产环境
        if (this.isDefault == null) this.isDefault = false;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
        if (this.isProd == null) this.isProd = true;
    }
}
