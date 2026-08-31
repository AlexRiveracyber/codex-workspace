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
public class ChatRequestDTO {
    private Long conversationId;
    private String providerKey; // default "huifu"
    private String modelKey; // e.g. "qwen3.8-max", "deepseek-v4-pro"
    private String systemPrompt;
    private List<ChatMessageDTO> messages;
    private Double temperature;
    private Integer maxTokens;
    private Boolean stream;
}
