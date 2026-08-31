package com.platform.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDTO {
    private String role; // "user", "assistant", "system"
    private String content; // text content
    private String thinking; // reasoning content
    private List<String> imageUrls; // for multimodal input
    private String videoUrl;
    private String audioUrl;
    private String mediaType; // "TEXT", "IMAGE", "VIDEO", "AUDIO"
}
