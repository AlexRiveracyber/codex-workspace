package com.platform.task.service;

import com.alibaba.fastjson2.JSON;
import com.huifu.bspay.sdk.opps.core.BasePay;
import com.huifu.bspay.sdk.opps.core.config.MerConfig;
import com.huifu.bspay.sdk.opps.core.net.BasePayRequest;
import com.platform.task.entity.HuifuApiLog;
import com.platform.task.entity.HuifuConfig;
import com.platform.task.repository.HuifuApiLogRepository;
import com.platform.task.repository.HuifuConfigRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class HuifuSdkService {

    private final HuifuConfigRepository configRepository;
    private final HuifuApiLogRepository logRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final DateTimeFormatter SEQ_FMT = DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS");

    @PostConstruct
    public void initDefaultConfig() {
        if (configRepository.count() == 0) {
            HuifuConfig defaultConfig = HuifuConfig.builder()
                    .configName("汇付斗拱-正式生产商户")
                    .sysId("6666000109133323")
                    .productId("YYZY")
                    .rsaMerchPrivateKey("MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCJvVbSHB3Ezo/2tqkKd6F6gJNIbYyoGczfMtC5G8SmO0Y+97non7tvQDCe0MoZPXku6HyBdFdiUo0lg2ouPKXmLkRFXJMQAYwTXpMXktcV2KloYamDPj9MTcwv6UXKlqkj/GpK05QTPRhnRlEvtc0vt4zZuNuhSzolPDf1zXQVCaO3I1ZdkzRDgoAZlDBqWXbsJa9aUbBebKYzF0jSf7Qv1CoZY7Zr6fsQ6xQRCGBvVPbK/kkw/pUPos0blcXQwu9PfdrukP9ZBpH1XZVeI32ZcFOp/k4W1zrRZaBsJiYGzuZe5NBm0pHGT33mQVnPAkwXFtT3JJ85HMv41yGYbUcJAgMBAAECggEANa+ez3Y2BCee5UJ80J+gSOckgO5yDHNB7x0XTY8NLt2bm59iztCzdcFHMh+fJgdX3HixTqPSC3ixmxWFpU/uObF+2qoih/KSblpGasHJI7K3FQA72fPBKDSKiYIaucPPWT9hDpk49eayRE6cBkSOHTMlqxbqRAvWNf0qspvJywjMbEWca+kMckSqIGnOCWnk9CXK3tncxR2lU74/shDO2jhS+LexPAGqtrXRRVjKQ4fbYCnoK3hyvtSB/R7bxpJ4mrHvvlDQWoP23wDsOGusFRSTU4gPrvzAijaet9go/nzOxa3Okucxq3YQcNWToaC2GzSwPsxb7u/ep6W4f8ZSgQKBgQC9A3MrXWA8Gy6f7BHUPRXL9zUB/vQhKymsflcT3DRaqvhT5isJJFAR/unSD7/y62XQyEW0yIwb5zkeKApO0lUkom5ogCAcOXLFdksG2gMG8sa5CZk53y5papd+vmmbRvs0F7h2QWUe8L46TQ5jWejbE13ug0Knmem7PhPdMZhjNQKBgQC6jfw/WZ64tJ+Y7l8tuRdEWhgNmdrWU3fJWKxzA8I9lmzm8kCswvZJCVc0vo5swB/n9GWYSF7tqPEC4O+DxHrJ0o6UqezujhiOK5yqpOtsI/hVCII7CCaytGxjcBfF7qvgbyKHMplCOKq4gVOhKKYSXkrdcCYCQI3tnhinCuHbBQKBgFMz3pG7Q+6RhJ+vOlX0IdEsW/Ap++tR5cFhyBEdAQrccf30twMKMhkJ3oGynytexe33CwA+u7ZYvYLx2z/BROugePuVUw05mLUlkndMpsJ7QlEX0ZRxEywiWNfZGAHbaB8RRgkAVnQdQ4/Edc30ORWe291veHrwvLvI4tOezlb1AoGBAKka8dA/HdiSqqVHVvGseUHVZT5W+/8SNGBIyDGN87I+PENwz12LcRMtq2Y9Yf+EfKeXa8yJtbs7TBVu7s6D+UYfXm22RvbLych+EgrBakJhrMbv6pU2Q1X0pNfSkUozmovcUfE51aEomuCbIsLQhRHbdYObGGksOTtu9yvcenU9AoGAaPcSmyr7aF37SWiwQkqXzWLo8Fs/RHTr8MNWt/PUlvWCANnTnyGO4G8bpER9OWFfuhV+VscbcbbFS1UqId1L2HbkvpR/AMbr3GGnx5wVy8KNTmO92TbugJ4KfjhObPrUl216LRwInCnoCiqIwpsBjFfumNG1rkX94HPmmrD8jNY=")
                    .rsaHuifuPublicKey("MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAml2x/5zAG/XLYS4i3u4pLlbDlMRFxwLh0QACGVNJYf9iFy7HFAQbqNfYzCXBMrgizbmJ12GHxlVjMB9l2T92USqIuEfqI2ONQ4A6iYTIw+UAq+QcHEgMuLOECgK5YpiIaSMfTy5fbxo6HikoYcVfslrZQyy/kMtbyBDnMoFqqyYDHYC4mZH0cwcvahAdWDiAuHppCOiXOmXnZCnK62veoRAzwZ1y0xhNPg6GZDDYmmPocw60WhmUWPS5cq3GgHe56UB91JCYr9hjTU2ZFXMYwp5unu2t/6H5KQA8MLrzEZ7wCQxTluS6G0aVffnlBxKyt2qwMEsOjDJ+Ib9Ripo7PQIDAQAB")
                    .isProd(true)
                    .isDefault(true)
                    .build();
            configRepository.save(defaultConfig);
            log.info("Initialized default Huifu production configuration for 6666000109133323");
        }
        refreshSdkConfig();
    }

    public synchronized void refreshSdkConfig() {
        HuifuConfig conf = getActiveConfig();
        if (conf != null) {
            applyConfigToSdk(conf);
        }
    }

    public synchronized void applyConfigToSdk(HuifuConfig conf) {
        try {
            MerConfig merConfig = new MerConfig();
            merConfig.setSysId(conf.getSysId());
            merConfig.setProductId(conf.getProductId());
            merConfig.setRsaPrivateKey(conf.getRsaMerchPrivateKey());
            merConfig.setRsaPublicKey(conf.getRsaHuifuPublicKey());

            // 默认为生产环境
            BasePay.prodMode = (conf.getIsProd() == null || conf.getIsProd()) ? BasePay.MODE_PROD : BasePay.MODE_TEST;
            BasePay.initWithMerConfig(merConfig);
            log.info("Huifu SDK applied config [{} - sys_id: {} - mode: {}]", conf.getConfigName(), conf.getSysId(), BasePay.prodMode);
        } catch (Exception e) {
            log.warn("Failed to apply Huifu SDK config: {}", e.getMessage());
        }
    }

    public HuifuConfig getActiveConfig() {
        return configRepository.findFirstByIsDefaultTrue()
                .or(configRepository::findFirstByOrderByIdDesc)
                .orElse(null);
    }

    public List<HuifuConfig> getAllConfigs() {
        return configRepository.findAllByOrderByIdDesc();
    }

    public Optional<HuifuConfig> getConfigById(Long id) {
        return configRepository.findById(id);
    }

    @Transactional
    public HuifuConfig saveConfig(HuifuConfig config) {
        if (config.getIsProd() == null) {
            config.setIsProd(true); // 默认生产
        }
        if (Boolean.TRUE.equals(config.getIsDefault())) {
            List<HuifuConfig> all = configRepository.findAll();
            for (HuifuConfig item : all) {
                if (!item.getId().equals(config.getId()) && Boolean.TRUE.equals(item.getIsDefault())) {
                    item.setIsDefault(false);
                    configRepository.save(item);
                }
            }
        }
        HuifuConfig saved = configRepository.save(config);
        applyConfigToSdk(saved);
        return saved;
    }

    @Transactional
    public void deleteConfig(Long id) {
        configRepository.deleteById(id);
        refreshSdkConfig();
    }

    @Transactional
    public HuifuConfig setDefaultConfig(Long id) {
        List<HuifuConfig> all = configRepository.findAll();
        HuifuConfig target = null;
        for (HuifuConfig c : all) {
            if (c.getId().equals(id)) {
                c.setIsDefault(true);
                target = c;
            } else {
                c.setIsDefault(false);
            }
            configRepository.save(c);
        }
        if (target != null) {
            applyConfigToSdk(target);
        }
        return target;
    }

    public HuifuConfig resolveConfig(Map<String, Object> params) {
        // 1. Check if explicit config_id is provided
        Object cfgIdObj = params.get("config_id");
        if (cfgIdObj != null) {
            try {
                Long cfgId = Long.valueOf(String.valueOf(cfgIdObj));
                Optional<HuifuConfig> opt = configRepository.findById(cfgId);
                if (opt.isPresent()) return opt.get();
            } catch (Exception ignored) {}
        }

        // 2. Check if sys_id is provided
        String sysId = (String) params.get("sys_id");
        if (StringUtils.isNotBlank(sysId)) {
            Optional<HuifuConfig> opt = configRepository.findFirstBySysId(sysId.trim());
            if (opt.isPresent()) return opt.get();
        }

        // 3. Fallback to active/default config
        return getActiveConfig();
    }

    public Map<String, Object> executeApi(String apiName, String apiPath, Map<String, Object> params) {
        long startTime = System.currentTimeMillis();
        String reqDate = (String) params.getOrDefault("req_date", LocalDateTime.now().format(DATE_FMT));
        String reqSeqId = (String) params.getOrDefault("req_seq_id", "REQ" + LocalDateTime.now().format(SEQ_FMT) + (int)(Math.random() * 1000));
        String huifuId = (String) params.getOrDefault("huifu_id", "");
        params.put("req_date", reqDate);
        params.put("req_seq_id", reqSeqId);

        // Dynamically resolve & apply the corresponding merchant SDK config
        HuifuConfig targetConfig = resolveConfig(params);
        if (targetConfig != null) {
            applyConfigToSdk(targetConfig);
        }

        Map<String, Object> responseMap = new LinkedHashMap<>();
        boolean isSuccess = false;
        String respCode = "999999";
        String respDesc = "";
        String applyId = "";

        try {
            log.info("Invoking Huifu API [{}] path [{}] with config [{}] sys_id [{}] reqSeqId [{}]",
                    apiName, apiPath, targetConfig != null ? targetConfig.getConfigName() : "DEFAULT",
                    targetConfig != null ? targetConfig.getSysId() : "N/A", reqSeqId);

            String cleanPath = apiPath.startsWith("/") ? apiPath.substring(1) : apiPath;

            // Direct SDK call
            Map<String, Object> sdkResp = BasePayRequest.requestBasePay(cleanPath, params);
            if (sdkResp != null) {
                responseMap.putAll(sdkResp);
                respCode = String.valueOf(sdkResp.getOrDefault("resp_code", ""));
                respDesc = String.valueOf(sdkResp.getOrDefault("resp_desc", ""));
                applyId = String.valueOf(sdkResp.getOrDefault("apply_id", ""));
                isSuccess = "00000000".equals(respCode) || "000000".equals(respCode) || "00".equals(respCode) || "SUCCESS".equalsIgnoreCase(respCode);
            }
        } catch (Exception e) {
            log.error("Huifu API invocation failed: {}", e.getMessage(), e);
            responseMap.put("resp_code", "ERROR");
            responseMap.put("resp_desc", "调用异常: " + e.getMessage());
            respDesc = e.getMessage();
        }

        long duration = System.currentTimeMillis() - startTime;

        try {
            HuifuApiLog apiLog = HuifuApiLog.builder()
                    .apiName(apiName)
                    .apiPath(apiPath)
                    .huifuId(huifuId)
                    .reqDate(reqDate)
                    .reqSeqId(reqSeqId)
                    .applyId(applyId)
                    .statusCode(isSuccess ? "SUCCESS" : "FAIL")
                    .respCode(respCode)
                    .respDesc(respDesc)
                    .requestPayload(JSON.toJSONString(params))
                    .responsePayload(JSON.toJSONString(responseMap))
                    .durationMs(duration)
                    .isSuccess(isSuccess)
                    .build();
            logRepository.save(apiLog);
        } catch (Exception ex) {
            log.warn("Failed to persist Huifu log: {}", ex.getMessage());
        }

        return responseMap;
    }

    public Map<String, Object> uploadImage(File file, String fileType, Long configId) {
        long startTime = System.currentTimeMillis();
        String reqDate = LocalDateTime.now().format(DATE_FMT);
        String reqSeqId = "IMG" + LocalDateTime.now().format(SEQ_FMT);

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("req_date", reqDate);
        params.put("req_seq_id", reqSeqId);
        params.put("file_type", fileType);
        if (configId != null) {
            params.put("config_id", configId);
        }

        HuifuConfig targetConfig = resolveConfig(params);
        if (targetConfig != null) {
            applyConfigToSdk(targetConfig);
        }

        Map<String, Object> responseMap = new LinkedHashMap<>();
        boolean isSuccess = false;
        String respCode = "";
        String respDesc = "";

        try {
            boolean isProd = targetConfig == null || targetConfig.getIsProd() == null || Boolean.TRUE.equals(targetConfig.getIsProd());
            Map<String, Object> sdkResp = BasePayRequest.requestBasePay(
                    "v2/merchant/image/upload",
                    params,
                    file,
                    file.getName(),
                    "file",
                    isProd
            );

            if (sdkResp != null) {
                responseMap.putAll(sdkResp);
                respCode = String.valueOf(sdkResp.getOrDefault("resp_code", ""));
                respDesc = String.valueOf(sdkResp.getOrDefault("resp_desc", ""));
                isSuccess = "00000000".equals(respCode) || "000000".equals(respCode) || "00".equals(respCode);
            }
        } catch (Exception e) {
            log.error("Image upload failed: {}", e.getMessage(), e);
            responseMap.put("resp_code", "ERROR");
            responseMap.put("resp_desc", "图片上传失败: " + e.getMessage());
            respDesc = e.getMessage();
        }

        long duration = System.currentTimeMillis() - startTime;

        try {
            HuifuApiLog apiLog = HuifuApiLog.builder()
                    .apiName("图片上传 (Image Upload)")
                    .apiPath("v2/merchant/image/upload")
                    .reqDate(reqDate)
                    .reqSeqId(reqSeqId)
                    .statusCode(isSuccess ? "SUCCESS" : "FAIL")
                    .respCode(respCode)
                    .respDesc(respDesc)
                    .requestPayload(JSON.toJSONString(Map.of("file_name", file.getName(), "file_size", file.length(), "file_type", fileType)))
                    .responsePayload(JSON.toJSONString(responseMap))
                    .durationMs(duration)
                    .isSuccess(isSuccess)
                    .build();
            logRepository.save(apiLog);
        } catch (Exception ex) {
            log.warn("Failed to log image upload: {}", ex.getMessage());
        }

        return responseMap;
    }

    public File downloadUrlToTempFile(String fileUrl) throws Exception {
        URL url = new URL(fileUrl);
        File tempFile = File.createTempFile("huifu_img_", ".jpg");
        try (InputStream in = url.openStream(); FileOutputStream out = new FileOutputStream(tempFile)) {
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = in.read(buffer)) != -1) {
                out.write(buffer, 0, bytesRead);
            }
        }
        return tempFile;
    }
}
