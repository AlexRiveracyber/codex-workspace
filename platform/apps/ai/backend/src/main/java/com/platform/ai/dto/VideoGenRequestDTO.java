package com.platform.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoGenRequestDTO {
    private String providerKey; // "huifu"
    private String modelKey; // "happyhorse-1.1-t2v", "happyhorse-1.1-i2v", "happyhorse-1.1-r2v"
    private String prompt;
    private String negativePrompt;
    private String inputImageUrl; // reference image for i2v or r2v
    private String aspectRatio; // "16:9", "9:16", "1:1"
    private Integer durationSec; // 5, 10
    private String motionStrength; // "low", "medium", "high"
}
