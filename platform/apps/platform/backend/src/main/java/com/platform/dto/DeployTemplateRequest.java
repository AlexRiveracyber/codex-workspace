package com.platform.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeployTemplateRequest {

    @NotBlank(message = "Template key is required")
    private String templateKey;

    @NotBlank(message = "App name is required")
    private String appName;

    private String containerName;

    private Integer hostPort;

    private String envVars;

    private Boolean startImmediately = true;
}
