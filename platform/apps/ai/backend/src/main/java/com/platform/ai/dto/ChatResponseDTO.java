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
public class ChatResponseDTO {
    private Boolean success;
    private Long conversationId;
    private Long messageId;
    private String role;
    private String content;
    private String thinking;
    private List<String> imageUrls;
    private String videoUrl;
    private String audioUrl;
    private String mediaType; // "TEXT", "IMAGE", "VIDEO", "AUDIO"
    private Integer tokensPrompt;
    private Integer tokensCompletion;
    private Integer latencyMs;
    private String errorMsg;
}
