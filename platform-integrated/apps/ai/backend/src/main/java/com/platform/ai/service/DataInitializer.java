package com.platform.ai.service;

import com.platform.ai.entity.AiModel;
import com.platform.ai.entity.AiProvider;
import com.platform.ai.repository.AiModelRepository;
import com.platform.ai.repository.AiProviderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final AiProviderRepository providerRepository;
    private final AiModelRepository modelRepository;

    @Override
    public void run(String... args) {
        initProviders();
        initModels();
    }

    private void initProviders() {
        if (providerRepository.count() == 0) {
            log.info("Seeding initial Huifu AI Provider...");
            AiProvider huifu = AiProvider.builder()
                    .name("汇付天下 AI 网关 (Huifu)")
                    .providerKey("huifu")
                    .baseUrl("https://ai.cloudpnr.com/token-plan/v1")
                    .apiKey("9UhsCipzFJRLJFjg")
                    .description("汇付官方 AI Token Plan 网关，聚合千问、DeepSeek、万相、HappyHorse 等多模态模型")
                    .enabled(true)
                    .isDefault(true)
                    .build();
            providerRepository.save(huifu);
        }
    }

    private void initModels() {
        if (modelRepository.count() == 0) {
            log.info("Seeding initial AI Models matrix...");
            List<AiModel> models = List.of(
                    // 1. 千问 (Qwen)
                    AiModel.builder().providerKey("huifu").brand("千问").modelName("qwen3.8-max").modelKey("qwen3.8-max")
                            .capabilities("文本生成、推理模型、视觉理解").modelType("CHAT").tag("New").contextLength(131072).enabled(true).sortOrder(1).build(),
                    AiModel.builder().providerKey("huifu").brand("千问").modelName("qwen3.8-flash").modelKey("qwen3.8-flash")
                            .capabilities("文本生成、推理模型、视觉理解").modelType("CHAT").tag("").contextLength(131072).enabled(true).sortOrder(2).build(),
                    AiModel.builder().providerKey("huifu").brand("千问").modelName("qwen3.7-plus").modelKey("qwen3.7-plus")
                            .capabilities("文本生成、推理模型、视觉理解").modelType("CHAT").tag("").contextLength(131072).enabled(true).sortOrder(3).build(),
                    AiModel.builder().providerKey("huifu").brand("千问").modelName("qwen3.7-max").modelKey("qwen3.7-max")
                            .capabilities("文本生成、推理模型").modelType("CHAT").tag("").contextLength(131072).enabled(true).sortOrder(4).build(),
                    AiModel.builder().providerKey("huifu").brand("千问").modelName("qwen3.6-plus").modelKey("qwen3.6-plus")
                            .capabilities("文本生成、推理模型、视觉理解").modelType("CHAT").tag("").contextLength(131072).enabled(true).sortOrder(5).build(),
                    AiModel.builder().providerKey("huifu").brand("千问").modelName("qwen3.6-flash").modelKey("qwen3.6-flash")
                            .capabilities("文本生成、推理模型、视觉理解").modelType("CHAT").tag("").contextLength(131072).enabled(true).sortOrder(6).build(),
                    AiModel.builder().providerKey("huifu").brand("千问").modelName("qwen-image-3.0-pro").modelKey("qwen-image-3.0-pro")
                            .capabilities("图片生成").modelType("IMAGE").tag("").contextLength(0).enabled(true).sortOrder(7).build(),
                    AiModel.builder().providerKey("huifu").brand("千问").modelName("qwen-image-2.0").modelKey("qwen-image-2.0")
                            .capabilities("图片生成").modelType("IMAGE").tag("").contextLength(0).enabled(true).sortOrder(8).build(),
                    AiModel.builder().providerKey("huifu").brand("千问").modelName("qwen-image-2.0-pro").modelKey("qwen-image-2.0-pro")
                            .capabilities("图片生成").modelType("IMAGE").tag("").contextLength(0).enabled(true).sortOrder(9).build(),
                    AiModel.builder().providerKey("huifu").brand("千问").modelName("qwen-audio-3.0-asr-flash").modelKey("qwen-audio-3.0-asr-flash")
                            .capabilities("语音识别").modelType("AUDIO").tag("").contextLength(0).enabled(true).sortOrder(10).build(),
                    AiModel.builder().providerKey("huifu").brand("千问").modelName("qwen-audio-3.0-tts-plus").modelKey("qwen-audio-3.0-tts-plus")
                            .capabilities("实时语音合成、语音合成").modelType("AUDIO").tag("").contextLength(0).enabled(true).sortOrder(11).build(),
                    AiModel.builder().providerKey("huifu").brand("千问").modelName("qwen-audio-3.0-realtime-plus").modelKey("qwen-audio-3.0-realtime-plus")
                            .capabilities("实时语音对话").modelType("AUDIO").tag("").contextLength(0).enabled(true).sortOrder(12).build(),

                    // 2. 万相 (Wanx)
                    AiModel.builder().providerKey("huifu").brand("万相").modelName("wan2.7-image").modelKey("wan2.7-image")
                            .capabilities("图片生成").modelType("IMAGE").tag("").contextLength(0).enabled(true).sortOrder(13).build(),
                    AiModel.builder().providerKey("huifu").brand("万相").modelName("wan2.7-image-pro").modelKey("wan2.7-image-pro")
                            .capabilities("图片生成").modelType("IMAGE").tag("").contextLength(0).enabled(true).sortOrder(14).build(),

                    // 3. HappyHorse
                    AiModel.builder().providerKey("huifu").brand("HappyHorse").modelName("happyhorse-1.1-i2v").modelKey("happyhorse-1.1-i2v")
                            .capabilities("视频生成 (图生视频)").modelType("VIDEO").tag("").contextLength(0).enabled(true).sortOrder(15).build(),
                    AiModel.builder().providerKey("huifu").brand("HappyHorse").modelName("happyhorse-1.1-t2v").modelKey("happyhorse-1.1-t2v")
                            .capabilities("视频生成 (文生视频)").modelType("VIDEO").tag("").contextLength(0).enabled(true).sortOrder(16).build(),
                    AiModel.builder().providerKey("huifu").brand("HappyHorse").modelName("happyhorse-1.1-r2v").modelKey("happyhorse-1.1-r2v")
                            .capabilities("视频生成 (参考生视频)").modelType("VIDEO").tag("").contextLength(0).enabled(true).sortOrder(17).build(),

                    // 4. DeepSeek
                    AiModel.builder().providerKey("huifu").brand("DeepSeek").modelName("deepseek-v4-pro-0813").modelKey("deepseek-v4-pro-0813")
                            .capabilities("文本生成、推理模型").modelType("CHAT").tag("限时夜间5折").contextLength(65536).enabled(true).sortOrder(18).build(),
                    AiModel.builder().providerKey("huifu").brand("DeepSeek").modelName("deepseek-v4-pro").modelKey("deepseek-v4-pro")
                            .capabilities("文本生成、推理模型").modelType("CHAT").tag("").contextLength(65536).enabled(true).sortOrder(19).build(),
                    AiModel.builder().providerKey("huifu").brand("DeepSeek").modelName("deepseek-v4-flash-0731").modelKey("deepseek-v4-flash-0731")
                            .capabilities("文本生成、推理模型").modelType("CHAT").tag("限时夜间5折").contextLength(65536).enabled(true).sortOrder(20).build(),
                    AiModel.builder().providerKey("huifu").brand("DeepSeek").modelName("deepseek-v4-flash").modelKey("deepseek-v4-flash")
                            .capabilities("文本生成、推理模型").modelType("CHAT").tag("").contextLength(65536).enabled(true).sortOrder(21).build(),
                    AiModel.builder().providerKey("huifu").brand("DeepSeek").modelName("deepseek-v3.2").modelKey("deepseek-v3.2")
                            .capabilities("文本生成、推理模型").modelType("CHAT").tag("").contextLength(65536).enabled(true).sortOrder(22).build(),

                    // 5. 智谱AI (GLM)
                    AiModel.builder().providerKey("huifu").brand("智谱AI").modelName("glm-5.2").modelKey("glm-5.2")
                            .capabilities("文本生成、推理模型").modelType("CHAT").tag("").contextLength(131072).enabled(true).sortOrder(23).build(),
                    AiModel.builder().providerKey("huifu").brand("智谱AI").modelName("glm-5.1").modelKey("glm-5.1")
                            .capabilities("文本生成、推理模型").modelType("CHAT").tag("").contextLength(131072).enabled(true).sortOrder(24).build(),
                    AiModel.builder().providerKey("huifu").brand("智谱AI").modelName("glm-5").modelKey("glm-5")
                            .capabilities("文本生成、推理模型").modelType("CHAT").tag("").contextLength(131072).enabled(true).sortOrder(25).build(),

                    // 6. 月之暗面 (Kimi)
                    AiModel.builder().providerKey("huifu").brand("月之暗面").modelName("kimi-k2.7-code").modelKey("kimi-k2.7-code")
                            .capabilities("文本生成、推理模型、视觉理解").modelType("CHAT").tag("").contextLength(200000).enabled(true).sortOrder(26).build(),
                    AiModel.builder().providerKey("huifu").brand("月之暗面").modelName("kimi-k2.6").modelKey("kimi-k2.6")
                            .capabilities("文本生成、推理模型、视觉理解").modelType("CHAT").tag("").contextLength(200000).enabled(true).sortOrder(27).build(),
                    AiModel.builder().providerKey("huifu").brand("月之暗面").modelName("kimi-k2.5").modelKey("kimi-k2.5")
                            .capabilities("文本生成、推理模型、视觉理解").modelType("CHAT").tag("").contextLength(200000).enabled(true).sortOrder(28).build(),

                    // 7. MiniMax
                    AiModel.builder().providerKey("huifu").brand("MiniMax").modelName("MiniMax-M2.5").modelKey("MiniMax-M2.5")
                            .capabilities("文本生成、推理模型").modelType("CHAT").tag("").contextLength(131072).enabled(true).sortOrder(29).build()
            );
            modelRepository.saveAll(models);
        }
    }
}
