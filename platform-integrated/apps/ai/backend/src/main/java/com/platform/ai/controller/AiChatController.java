package com.platform.ai.controller;

import com.platform.ai.dto.ChatRequestDTO;
import com.platform.ai.dto.ChatResponseDTO;
import com.platform.ai.entity.AiConversation;
import com.platform.ai.entity.AiMessage;
import com.platform.ai.service.AiChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai/chat")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService chatService;

    // Conversations
    @GetMapping("/conversations")
    public ResponseEntity<List<AiConversation>> listConversations() {
        return ResponseEntity.ok(chatService.listConversations());
    }

    @PostMapping("/conversations")
    public ResponseEntity<AiConversation> createConversation(@RequestBody Map<String, String> body) {
        String title = body.get("title");
        String modelKey = body.get("model_key");
        String providerKey = body.get("provider_key");
        String systemPrompt = body.get("system_prompt");
        return ResponseEntity.ok(chatService.createConversation(title, modelKey, providerKey, systemPrompt));
    }

    @GetMapping("/conversations/{id}")
    public ResponseEntity<Map<String, Object>> getConversationDetail(@PathVariable Long id) {
        AiConversation conversation = chatService.getConversation(id).orElseThrow(() -> new RuntimeException("Conversation not found"));
        List<AiMessage> messages = chatService.getMessages(id);
        return ResponseEntity.ok(Map.of(
                "conversation", conversation,
                "messages", messages
        ));
    }

    @PutMapping("/conversations/{id}")
    public ResponseEntity<AiConversation> updateConversation(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String title = body.get("title");
        String systemPrompt = body.get("system_prompt");
        return ResponseEntity.ok(chatService.updateConversation(id, title, systemPrompt));
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<Map<String, Object>> deleteConversation(@PathVariable Long id) {
        chatService.deleteConversation(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // Chat completions
    @PostMapping("/completions")
    public ResponseEntity<ChatResponseDTO> chatCompletion(@RequestBody ChatRequestDTO request) {
        return ResponseEntity.ok(chatService.chatCompletion(request));
    }

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChat(@RequestBody ChatRequestDTO request) {
        return chatService.streamChat(request);
    }
}
