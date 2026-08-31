package com.platform.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageGenRequestDTO {
    private String providerKey; // "huifu"
    private String modelKey; // "qwen-image-3.0-pro", "wan2.7-image-pro"
    private String prompt;
    private String negativePrompt;
    private String aspectRatio; // "1:1", "16:9", "9:16", "4:3", "3:4"
    private String size; // "1024x1024", "1280x720", etc.
    private Integer n; // number of images, default 1
    private String style; // "anime", "photorealistic", "digital_art", etc.
}
