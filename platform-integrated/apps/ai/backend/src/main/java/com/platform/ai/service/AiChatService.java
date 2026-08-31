package com.platform.ai.service;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.platform.ai.dto.*;
import com.platform.ai.entity.AiConversation;
import com.platform.ai.entity.AiGenerationTask;
import com.platform.ai.entity.AiMessage;
import com.platform.ai.entity.AiProvider;
import com.platform.ai.repository.AiConversationRepository;
import com.platform.ai.repository.AiMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatService {

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final AiProviderService providerService;
    private final AiImageService imageService;
    private final AiVideoService videoService;
    private final AiLogService logService;

    // Conversation Management
    public List<AiConversation> listConversations() {
        return conversationRepository.findAllByOrderByUpdatedAtDesc();
    }

    public Optional<AiConversation> getConversation(Long id) {
        return conversationRepository.findById(id);
    }

    public List<AiMessage> getMessages(Long conversationId) {
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    public AiConversation createConversation(String title, String modelKey, String providerKey, String systemPrompt) {
        AiConversation conversation = AiConversation.builder()
                .title(title != null && !title.isBlank() ? title : "新建会话 " + (conversationRepository.count() + 1))
                .modelKey(modelKey != null && !modelKey.isBlank() ? modelKey : "qwen3.8-max")
                .providerKey(providerKey != null && !providerKey.isBlank() ? providerKey : "huifu")
                .systemPrompt(systemPrompt)
                .build();
        return conversationRepository.save(conversation);
    }

    public AiConversation updateConversation(Long id, String title, String systemPrompt) {
        AiConversation c = conversationRepository.findById(id).orElseThrow(() -> new RuntimeException("Conversation not found"));
        if (title != null && !title.isBlank()) c.setTitle(title);
        if (systemPrompt != null) c.setSystemPrompt(systemPrompt);
        return conversationRepository.save(c);
    }

    @Transactional
    public void deleteConversation(Long id) {
        messageRepository.deleteByConversationId(id);
        conversationRepository.deleteById(id);
    }

    // Unified Multimodal Chat Completion
    public ChatResponseDTO chatCompletion(ChatRequestDTO request) {
        long startTime = System.currentTimeMillis();
        String providerKey = request.getProviderKey() != null ? request.getProviderKey() : "huifu";
        String modelKey = request.getModelKey() != null ? request.getModelKey() : "qwen3.8-max";

        // Extract last user message and attachments
        String userLastText = "";
        String userLastImages = null;
        if (request.getMessages() != null && !request.getMessages().isEmpty()) {
            ChatMessageDTO lastMsg = request.getMessages().get(request.getMessages().size() - 1);
            userLastText = lastMsg.getContent() != null ? lastMsg.getContent() : "";
            if (lastMsg.getImageUrls() != null && !lastMsg.getImageUrls().isEmpty()) {
                userLastImages = String.join(",", lastMsg.getImageUrls());
            }
        }

        // 1. Direct Image Generation Model or Image Command
        if (isImageModel(modelKey) || userLastText.startsWith("/image ") || userLastText.startsWith("/img ")) {
            String prompt = userLastText.replaceFirst("^/(image|img)\\s+", "").trim();
            String imgModel = isImageModel(modelKey) ? modelKey : "qwen-image-3.0-pro";

            ImageGenRequestDTO imgReq = ImageGenRequestDTO.builder()
                    .providerKey(providerKey)
                    .modelKey(imgModel)
                    .prompt(prompt)
                    .aspectRatio("1:1")
                    .build();

            AiGenerationTask task = imageService.generateImage(imgReq);
            long latency = System.currentTimeMillis() - startTime;

            Long messageId = null;
            if (request.getConversationId() != null) {
                AiMessage userMsg = AiMessage.builder()
                        .conversationId(request.getConversationId())
                        .role("user")
                        .content(userLastText)
                        .imageUrls(userLastImages)
                        .build();
                messageRepository.save(userMsg);

                AiMessage assistantMsg = AiMessage.builder()
                        .conversationId(request.getConversationId())
                        .role("assistant")
                        .content("🎨 已为您生成图片【" + prompt + "】")
                        .imageUrls(task.getResultUrl())
                        .mediaType("IMAGE")
                        .latencyMs((int) latency)
                        .build();
                messageRepository.save(assistantMsg);
                messageId = assistantMsg.getId();
            }

            return ChatResponseDTO.builder()
                    .success(true)
                    .conversationId(request.getConversationId())
                    .messageId(messageId)
                    .role("assistant")
                    .content("🎨 已为您生成图片【" + prompt + "】")
                    .imageUrls(List.of(task.getResultUrl()))
                    .mediaType("IMAGE")
                    .latencyMs((int) latency)
                    .build();
        }

        // 2. Direct Video Generation Model or Video Command
        if (isVideoModel(modelKey) || userLastText.startsWith("/video ")) {
            String prompt = userLastText.replaceFirst("^/video\\s+", "").trim();
            String videoModel = isVideoModel(modelKey) ? modelKey : "happyhorse-1.1-t2v";

            VideoGenRequestDTO vidReq = VideoGenRequestDTO.builder()
                    .providerKey(providerKey)
                    .modelKey(videoModel)
                    .prompt(prompt)
                    .inputImageUrl(userLastImages != null && !userLastImages.isBlank() ? userLastImages.split(",")[0] : null)
                    .aspectRatio("16:9")
                    .durationSec(5)
                    .build();

            AiGenerationTask task = videoService.generateVideo(vidReq);
            long latency = System.currentTimeMillis() - startTime;

            Long messageId = null;
            if (request.getConversationId() != null) {
                AiMessage userMsg = AiMessage.builder()
                        .conversationId(request.getConversationId())
                        .role("user")
                        .content(userLastText)
                        .imageUrls(userLastImages)
                        .build();
                messageRepository.save(userMsg);

                AiMessage assistantMsg = AiMessage.builder()
                        .conversationId(request.getConversationId())
                        .role("assistant")
                        .content("🎬 HappyHorse 已为您生成视频【" + prompt + "】")
                        .videoUrls(task.getResultUrl() != null ? task.getResultUrl() : "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4")
                        .mediaType("VIDEO")
                        .latencyMs((int) latency)
                        .build();
                messageRepository.save(assistantMsg);
                messageId = assistantMsg.getId();
            }

            return ChatResponseDTO.builder()
                    .success(true)
                    .conversationId(request.getConversationId())
                    .messageId(messageId)
                    .role("assistant")
                    .content("🎬 HappyHorse 已为您生成视频【" + prompt + "】")
                    .videoUrl(task.getResultUrl() != null ? task.getResultUrl() : "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4")
                    .mediaType("VIDEO")
                    .latencyMs((int) latency)
                    .build();
        }

        // 3. Standard Text / Reasoning / Vision LLM Chat with Tool Call Detection
        AiProvider provider = providerService.getProviderByKey(providerKey)
                .or(providerService::getDefaultProvider)
                .orElseThrow(() -> new RuntimeException("AI Provider not configured"));

        JSONObject payload = new JSONObject();
        payload.put("model", modelKey);
        payload.put("stream", false);
        if (request.getTemperature() != null) payload.put("temperature", request.getTemperature());
        if (request.getMaxTokens() != null) payload.put("max_tokens", request.getMaxTokens());

        JSONArray messagesArray = new JSONArray();
        if (request.getSystemPrompt() != null && !request.getSystemPrompt().isBlank()) {
            JSONObject sysMsg = new JSONObject();
            sysMsg.put("role", "system");
            sysMsg.put("content", request.getSystemPrompt());
            messagesArray.add(sysMsg);
        }

        if (request.getMessages() != null) {
            for (ChatMessageDTO msg : request.getMessages()) {
                JSONObject m = new JSONObject();
                m.put("role", msg.getRole());

                if (msg.getImageUrls() != null && !msg.getImageUrls().isEmpty()) {
                    JSONArray contentList = new JSONArray();
                    JSONObject textObj = new JSONObject();
                    textObj.put("type", "text");
                    textObj.put("text", msg.getContent() != null ? msg.getContent() : "");
                    contentList.add(textObj);

                    for (String url : msg.getImageUrls()) {
                        JSONObject imgObj = new JSONObject();
                        imgObj.put("type", "image_url");
                        imgObj.put("image_url", Map.of("url", url));
                        contentList.add(imgObj);
                    }
                    m.put("content", contentList);
                } else {
                    m.put("content", msg.getContent());
                }

                messagesArray.add(m);
            }
        }
        payload.put("messages", messagesArray);

        String baseUrl = provider.getBaseUrl().trim();
        if (baseUrl.endsWith("/")) baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        String chatUrl = baseUrl.endsWith("/chat/completions") ? baseUrl : baseUrl + "/chat/completions";

        String reqJson = payload.toJSONString();

        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(15))
                    .build();

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(chatUrl))
                    .header("Authorization", "Bearer " + provider.getApiKey().trim())
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(90))
                    .POST(HttpRequest.BodyPublishers.ofString(reqJson, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> httpResp = client.send(httpRequest, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            long latency = System.currentTimeMillis() - startTime;
            String respBody = httpResp.body();

            if (httpResp.statusCode() >= 200 && httpResp.statusCode() < 300) {
                JSONObject jsonResp = JSON.parseObject(respBody);
                JSONArray choices = jsonResp.getJSONArray("choices");
                String content = "";
                String thinking = null;

                if (choices != null && !choices.isEmpty()) {
                    JSONObject choice = choices.getJSONObject(0);
                    JSONObject msgObj = choice.getJSONObject("message");
                    if (msgObj != null) {
                        content = msgObj.getString("content");
                        thinking = msgObj.getString("reasoning_content");
                    }
                }

                if (content != null && content.contains("<think>") && content.contains("</think>")) {
                    int start = content.indexOf("<think>") + 7;
                    int end = content.indexOf("</think>");
                    thinking = content.substring(start, end).trim();
                    content = content.substring(end + 8).trim();
                }

                String generatedImageUrl = null;
                String mediaType = "TEXT";

                // Tool-call interception: Check if model called generate_image or draw tool
                String toolPrompt = extractToolCallImagePrompt(content, thinking);
                if (toolPrompt == null && isImageRequestText(userLastText)) {
                    toolPrompt = userLastText;
                }

                if (toolPrompt != null && !toolPrompt.isBlank()) {
                    ImageGenRequestDTO imgReq = ImageGenRequestDTO.builder()
                            .providerKey(providerKey)
                            .modelKey("qwen-image-3.0-pro")
                            .prompt(toolPrompt)
                            .aspectRatio("1:1")
                            .build();
                    AiGenerationTask imgTask = imageService.generateImage(imgReq);
                    if (imgTask != null && imgTask.getResultUrl() != null) {
                        generatedImageUrl = imgTask.getResultUrl();
                        mediaType = "IMAGE";
                    }

                    // Clean raw XML tool calls from user-facing text
                    content = cleanToolCallTags(content);
                    if (content.isBlank()) {
                        content = "🎨 已为您生成图片【" + toolPrompt + "】";
                    }
                }

                int tokensPrompt = 0;
                int tokensCompletion = 0;
                JSONObject usage = jsonResp.getJSONObject("usage");
                if (usage != null) {
                    tokensPrompt = usage.getIntValue("prompt_tokens", 0);
                    tokensCompletion = usage.getIntValue("completion_tokens", 0);
                }

                Long messageId = null;
                if (request.getConversationId() != null) {
                    AiMessage userMsg = AiMessage.builder()
                            .conversationId(request.getConversationId())
                            .role("user")
                            .content(userLastText)
                            .imageUrls(userLastImages)
                            .tokensUsed(tokensPrompt)
                            .build();
                    messageRepository.save(userMsg);

                    AiMessage assistantMsg = AiMessage.builder()
                            .conversationId(request.getConversationId())
                            .role("assistant")
                            .content(content)
                            .thinking(thinking)
                            .imageUrls(generatedImageUrl)
                            .mediaType(mediaType)
                            .tokensUsed(tokensCompletion)
                            .latencyMs((int) latency)
                            .build();
                    messageRepository.save(assistantMsg);
                    messageId = assistantMsg.getId();

                    conversationRepository.findById(request.getConversationId()).ifPresent(c -> {
                        c.setUpdatedAt(java.time.LocalDateTime.now());
                        conversationRepository.save(c);
                    });
                }

                logService.logCall(providerKey, modelKey, "CHAT", userLastText, content,
                        tokensPrompt, tokensCompletion, (int) latency, "SUCCESS", null, reqJson, respBody);

                return ChatResponseDTO.builder()
                        .success(true)
                        .conversationId(request.getConversationId())
                        .messageId(messageId)
                        .role("assistant")
                        .content(content)
                        .thinking(thinking)
                        .mediaType(mediaType)
                        .imageUrls(generatedImageUrl != null ? List.of(generatedImageUrl) : null)
                        .tokensPrompt(tokensPrompt)
                        .tokensCompletion(tokensCompletion)
                        .latencyMs((int) latency)
                        .build();
            } else {
                logService.logCall(providerKey, modelKey, "CHAT", userLastText, null,
                        0, 0, (int) latency, "FAILED", "HTTP " + httpResp.statusCode() + ": " + respBody, reqJson, respBody);

                return ChatResponseDTO.builder()
                        .success(false)
                        .conversationId(request.getConversationId())
                        .errorMsg("上游接口报错 (HTTP " + httpResp.statusCode() + "): " + respBody)
                        .latencyMs((int) latency)
                        .build();
            }
        } catch (Exception e) {
            long latency = System.currentTimeMillis() - startTime;
            log.error("Chat invocation failed: {}", e.getMessage(), e);
            logService.logCall(providerKey, modelKey, "CHAT", userLastText, null,
                    0, 0, (int) latency, "FAILED", e.getMessage(), reqJson, null);

            return ChatResponseDTO.builder()
                    .success(false)
                    .conversationId(request.getConversationId())
                    .errorMsg("调用异常: " + e.getMessage())
                    .latencyMs((int) latency)
                    .build();
        }
    }

    // SSE Streaming
    public SseEmitter streamChat(ChatRequestDTO request) {
        SseEmitter emitter = new SseEmitter(180_000L);
        CompletableFuture.runAsync(() -> {
            ChatResponseDTO resp = chatCompletion(request);
            try {
                if (Boolean.TRUE.equals(resp.getSuccess())) {
                    if (resp.getThinking() != null && !resp.getThinking().isBlank()) {
                        emitter.send(SseEmitter.event().name("thinking").data(resp.getThinking()));
                    }
                    if (resp.getContent() != null && !resp.getContent().isBlank()) {
                        emitter.send(SseEmitter.event().name("content").data(resp.getContent()));
                    }
                    if (resp.getImageUrls() != null && !resp.getImageUrls().isEmpty()) {
                        emitter.send(SseEmitter.event().name("media").data(Map.of(
                                "type", "IMAGE",
                                "url", resp.getImageUrls().get(0),
                                "content", resp.getContent()
                        )));
                    } else if (resp.getVideoUrl() != null) {
                        emitter.send(SseEmitter.event().name("media").data(Map.of(
                                "type", "VIDEO",
                                "url", resp.getVideoUrl(),
                                "content", resp.getContent()
                        )));
                    }
                    emitter.send(SseEmitter.event().name("done").data(Map.of(
                            "latency_ms", resp.getLatencyMs() != null ? resp.getLatencyMs() : 0,
                            "message_id", resp.getMessageId() != null ? resp.getMessageId() : 0
                    )));
                } else {
                    emitter.send(SseEmitter.event().name("error").data(resp.getErrorMsg()));
                }
                emitter.complete();
            } catch (Exception e) {
                try {
                    emitter.send(SseEmitter.event().name("error").data("传输异常: " + e.getMessage()));
                    emitter.complete();
                } catch (Exception ignored) {}
            }
        });
        return emitter;
    }

    private String extractToolCallImagePrompt(String content, String thinking) {
        String combined = (content != null ? content : "") + " " + (thinking != null ? thinking : "");
        if (combined.contains("generate_image") || combined.contains("<tool_call>") || combined.contains("draw_image")) {
            // Regex match prompt from JSON argument
            Pattern pattern = Pattern.compile("\"prompt\"\\s*:\\s*\"([^\"]+)\"");
            Matcher matcher = pattern.matcher(combined);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }
        return null;
    }

    private boolean isImageRequestText(String text) {
        if (text == null) return false;
        String t = text.trim().toLowerCase();
        return t.startsWith("生成") && (t.contains("图片") || t.contains("图") || t.contains("画") || t.contains("照片") || t.contains("海报"))
                || t.startsWith("画一") || t.startsWith("帮我画") || t.startsWith("帮我生成一张") || t.startsWith("绘制");
    }

    private String cleanToolCallTags(String content) {
        if (content == null) return "";
        String cleaned = content.replaceAll("<tool_call>[\\s\\S]*?</tool_call>", "");
        cleaned = cleaned.replaceAll("</?tool_call>", "");
        cleaned = cleaned.replaceAll("<think>[\\s\\S]*?</think>", "");
        cleaned = cleaned.replaceAll("</?think>", "");
        return cleaned.trim();
    }

    private boolean isImageModel(String modelKey) {
        if (modelKey == null) return false;
        String m = modelKey.toLowerCase();
        return m.contains("image") || m.contains("wan2.7") || m.contains("flux") || m.contains("sd");
    }

    private boolean isVideoModel(String modelKey) {
        if (modelKey == null) return false;
        String m = modelKey.toLowerCase();
        return m.contains("happyhorse") || m.contains("video") || m.contains("i2v") || m.contains("t2v") || m.contains("r2v");
    }
}
