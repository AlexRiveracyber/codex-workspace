package com.platform.task.controller;

import com.platform.task.entity.HuifuApiLog;
import com.platform.task.entity.HuifuConfig;
import com.platform.task.repository.HuifuApiLogRepository;
import com.platform.task.service.ExcelParseService;
import com.platform.task.service.HuifuSdkService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.*;
import java.util.concurrent.*;

@Slf4j
@RestController
@RequestMapping("/api/huifu")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class HuifuController {

    private final HuifuSdkService huifuSdkService;
    private final ExcelParseService excelParseService;
    private final HuifuApiLogRepository logRepository;

    private final ExecutorService batchExecutor = Executors.newFixedThreadPool(8);

    @GetMapping("/config")
    public ResponseEntity<HuifuConfig> getConfig() {
        return ResponseEntity.ok(huifuSdkService.getActiveConfig());
    }

    @GetMapping("/configs")
    public ResponseEntity<List<HuifuConfig>> getAllConfigs() {
        return ResponseEntity.ok(huifuSdkService.getAllConfigs());
    }

    @GetMapping("/config/{id}")
    public ResponseEntity<HuifuConfig> getConfigById(@PathVariable Long id) {
        return huifuSdkService.getConfigById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/config")
    public ResponseEntity<HuifuConfig> saveConfig(@RequestBody HuifuConfig config) {
        return ResponseEntity.ok(huifuSdkService.saveConfig(config));
    }

    @DeleteMapping("/config/{id}")
    public ResponseEntity<Map<String, Object>> deleteConfig(@PathVariable Long id) {
        huifuSdkService.deleteConfig(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "配置删除成功"));
    }

    @PostMapping("/config/{id}/default")
    public ResponseEntity<HuifuConfig> setDefaultConfig(@PathVariable Long id) {
        return ResponseEntity.ok(huifuSdkService.setDefaultConfig(id));
    }

    @GetMapping("/logs")
    public ResponseEntity<List<HuifuApiLog>> getLogs(
            @RequestParam(required = false) String huifuId,
            @RequestParam(required = false) String applyId) {
        if (StringUtils.isNotBlank(huifuId)) {
            return ResponseEntity.ok(logRepository.findByHuifuIdOrderByCreatedAtDesc(huifuId.trim()));
        }
        if (StringUtils.isNotBlank(applyId)) {
            return ResponseEntity.ok(logRepository.findByApplyIdOrderByCreatedAtDesc(applyId.trim()));
        }
        return ResponseEntity.ok(logRepository.findTop100ByOrderByCreatedAtDesc());
    }

    @PostMapping("/api/invoke")
    public ResponseEntity<Map<String, Object>> invokeApi(@RequestBody Map<String, Object> body) {
        String apiName = (String) body.getOrDefault("api_name", "通用接口调用");
        String apiPath = (String) body.getOrDefault("api_path", "");
        @SuppressWarnings("unchecked")
        Map<String, Object> params = (Map<String, Object>) body.getOrDefault("params", new HashMap<>());

        Map<String, Object> result = huifuSdkService.executeApi(apiName, apiPath, params);
        return ResponseEntity.ok(result);
    }

    // 1. 企业商户进件
    @PostMapping("/merchant/enterprise/open")
    public ResponseEntity<Map<String, Object>> enterpriseOpen(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("企业商户基本信息入驻", "v2/merchant/busi/company/open", params);
        return ResponseEntity.ok(resp);
    }

    // 2. 个人商户进件
    @PostMapping("/merchant/personal/open")
    public ResponseEntity<Map<String, Object>> personalOpen(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("个人商户基本信息入驻", "v2/merchant/busi/indv/open", params);
        return ResponseEntity.ok(resp);
    }

    // 3. 商户基本信息修改
    @PostMapping("/merchant/modify")
    public ResponseEntity<Map<String, Object>> modifyMerchant(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("商户基本信息修改", "v2/merchant/busi/modify", params);
        return ResponseEntity.ok(resp);
    }

    // 4. 商户业务开通
    @PostMapping("/merchant/busi/open")
    public ResponseEntity<Map<String, Object>> openBusiness(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("商户业务开通", "v2/merchant/busi/open", params);
        return ResponseEntity.ok(resp);
    }

    // 5. 商户业务开通修改
    @PostMapping("/merchant/busi/modify")
    public ResponseEntity<Map<String, Object>> modifyBusiness(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("商户业务开通修改", "v2/merchant/busi/modify", params);
        return ResponseEntity.ok(resp);
    }

    // 6. 商户详细信息查询
    @PostMapping("/merchant/query")
    public ResponseEntity<Map<String, Object>> queryMerchant(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("商户详细信息查询", "v2/merchant/busi/query", params);
        return ResponseEntity.ok(resp);
    }

    // 7. 申请单状态查询
    @PostMapping("/apply/status/query")
    public ResponseEntity<Map<String, Object>> queryApplyStatus(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("申请单状态查询", "v2/merchant/busi/status/query", params);
        return ResponseEntity.ok(resp);
    }

    // 8. 商户短信发送
    @PostMapping("/merchant/sms/send")
    public ResponseEntity<Map<String, Object>> sendSms(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("商户短信发送", "v2/merchant/sms/send", params);
        return ResponseEntity.ok(resp);
    }

    // 9. 商户状态变更
    @PostMapping("/merchant/status/modify")
    public ResponseEntity<Map<String, Object>> modifyStatus(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("商户状态变更", "v2/merchant/status/modify", params);
        return ResponseEntity.ok(resp);
    }

    // 10. 商户费率信息查询
    @PostMapping("/merchant/fee/query")
    public ResponseEntity<Map<String, Object>> queryFee(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("商户费率信息查询", "v2/merchant/fee/query", params);
        return ResponseEntity.ok(resp);
    }

    // 11. 商户多费率配置
    @PostMapping("/merchant/fee/config")
    public ResponseEntity<Map<String, Object>> configFee(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("商户多费率配置", "v2/merchant/fee/config", params);
        return ResponseEntity.ok(resp);
    }

    // 12. 图片上传 (支持本地文件选择或 file_url)
    @PostMapping("/media/upload")
    public ResponseEntity<Map<String, Object>> uploadImage(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "file_url", required = false) String fileUrl,
            @RequestParam(value = "file_type", defaultValue = "F01") String fileType,
            @RequestParam(value = "config_id", required = false) Long configId) {
        try {
            File uploadTargetFile;
            if (file != null && !file.isEmpty()) {
                uploadTargetFile = File.createTempFile("huifu_upload_", "_" + file.getOriginalFilename());
                file.transferTo(uploadTargetFile);
            } else if (StringUtils.isNotBlank(fileUrl)) {
                uploadTargetFile = huifuSdkService.downloadUrlToTempFile(fileUrl.trim());
            } else {
                return ResponseEntity.badRequest().body(Map.of("resp_code", "PARAM_ERROR", "resp_desc", "请上传本地图片或提供图片 file_url"));
            }

            Map<String, Object> resp = huifuSdkService.uploadImage(uploadTargetFile, fileType, configId);
            uploadTargetFile.delete();
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("Failed to upload image: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of("resp_code", "ERROR", "resp_desc", "图片上传异常: " + e.getMessage()));
        }
    }

    // 13. 解析 Excel 中的商户号 huifu_id
    @PostMapping("/batch/parse-excel")
    public ResponseEntity<Map<String, Object>> parseExcel(@RequestParam("file") MultipartFile file) {
        try {
            List<String> huifuIds = excelParseService.extractHuifuIds(file);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "count", huifuIds.size(),
                    "huifu_ids", huifuIds
            ));
        } catch (Exception e) {
            log.error("Excel parse failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Excel解析失败: " + e.getMessage()
            ));
        }
    }

    // 14. 批量异步/同步任务分发
    @PostMapping("/batch/execute")
    public ResponseEntity<Map<String, Object>> executeBatchTask(@RequestBody Map<String, Object> request) {
        String apiName = (String) request.getOrDefault("api_name", "批量任务执行");
        String apiPath = (String) request.getOrDefault("api_path", "v2/merchant/busi/query");
        @SuppressWarnings("unchecked")
        List<String> huifuIds = (List<String>) request.getOrDefault("huifu_ids", Collections.emptyList());
        @SuppressWarnings("unchecked")
        Map<String, Object> baseParams = (Map<String, Object>) request.getOrDefault("params", new HashMap<>());

        if (huifuIds.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "商户号 huifu_id 列表为空"));
        }

        List<Map<String, Object>> results = new ArrayList<>();
        int successCount = 0;
        int failCount = 0;

        for (String id : huifuIds) {
            String cleanId = id.trim();
            if (StringUtils.isBlank(cleanId)) continue;

            Map<String, Object> currentParams = new HashMap<>(baseParams);
            currentParams.put("huifu_id", cleanId);

            Map<String, Object> resp = huifuSdkService.executeApi(apiName, apiPath, currentParams);
            String respCode = String.valueOf(resp.getOrDefault("resp_code", ""));
            boolean isSuccess = "00000000".equals(respCode) || "000000".equals(respCode) || "00".equals(respCode);
            if (isSuccess) successCount++;
            else failCount++;

            Map<String, Object> itemResult = new LinkedHashMap<>();
            itemResult.put("huifu_id", cleanId);
            itemResult.put("is_success", isSuccess);
            itemResult.put("resp_code", respCode);
            itemResult.put("resp_desc", resp.getOrDefault("resp_desc", ""));
            itemResult.put("response", resp);
            results.add(itemResult);
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "total", results.size(),
                "success_count", successCount,
                "fail_count", failCount,
                "items", results
        ));
    }

    // ================= 交易与聚合支付相关接口 =================

    // 15. 聚合主扫 / 动态收款码 / JSAPI 支付 (v2/trade/payment/jspay)
    @PostMapping("/trade/jspay")
    public ResponseEntity<Map<String, Object>> tradeJspay(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("聚合主扫/JSAPI支付", "v2/trade/payment/jspay", params);
        return ResponseEntity.ok(resp);
    }

    // 16. 聚合反扫 / 付款码刷卡支付 (v2/trade/payment/micropay)
    @PostMapping("/trade/micropay")
    public ResponseEntity<Map<String, Object>> tradeMicropay(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("聚合反扫/付款码支付", "v2/trade/payment/micropay", params);
        return ResponseEntity.ok(resp);
    }

    // 17. 移动端 H5 / WAP 网页支付 (v2/trade/onlinepayment/wappay)
    @PostMapping("/trade/wappay")
    public ResponseEntity<Map<String, Object>> tradeWappay(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("移动端H5/WAP支付", "v2/trade/onlinepayment/wappay", params);
        return ResponseEntity.ok(resp);
    }

    // 18. 网银支付 (v2/trade/onlinepayment/banking/frontpay)
    @PostMapping("/trade/bankpay")
    public ResponseEntity<Map<String, Object>> tradeBankpay(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("B2C/B2B网银支付", "v2/trade/onlinepayment/banking/frontpay", params);
        return ResponseEntity.ok(resp);
    }

    // 19. 快捷支付 (v2/trade/onlinepayment/quickpay/frontpay)
    @PostMapping("/trade/quickpay")
    public ResponseEntity<Map<String, Object>> tradeQuickpay(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("快捷支付/协议支付", "v2/trade/onlinepayment/quickpay/frontpay", params);
        return ResponseEntity.ok(resp);
    }

    // 20. 交易查询 (v2/trade/payment/scanpay/query)
    @PostMapping("/trade/query")
    public ResponseEntity<Map<String, Object>> tradeQuery(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("交易订单查询", "v2/trade/payment/scanpay/query", params);
        return ResponseEntity.ok(resp);
    }

    // 21. 交易退款 (v2/trade/payment/scanpay/refund)
    @PostMapping("/trade/refund")
    public ResponseEntity<Map<String, Object>> tradeRefund(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("交易退款申请", "v2/trade/payment/scanpay/refund", params);
        return ResponseEntity.ok(resp);
    }

    // 22. 退款状态查询 (v2/trade/payment/scanpay/refundquery)
    @PostMapping("/trade/refundquery")
    public ResponseEntity<Map<String, Object>> tradeRefundQuery(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("退款结果查询", "v2/trade/payment/scanpay/refundquery", params);
        return ResponseEntity.ok(resp);
    }

    // ================= 解决方案 / 延时交易 (Delay Transactions) =================

    // 23. 交易确认 (v2/trade/payment/delaytrans/confirm)
    @PostMapping("/delaytrans/confirm")
    public ResponseEntity<Map<String, Object>> delaytransConfirm(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("延时交易-交易确认", "v2/trade/payment/delaytrans/confirm", params);
        return ResponseEntity.ok(resp);
    }

    // 24. 交易确认查询 (v2/trade/payment/delaytrans/confirm/query)
    @PostMapping("/delaytrans/confirm/query")
    public ResponseEntity<Map<String, Object>> delaytransConfirmQuery(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("延时交易-交易确认查询", "v2/trade/payment/delaytrans/confirm/query", params);
        return ResponseEntity.ok(resp);
    }

    // 25. 交易确认退款 (v2/trade/payment/delaytrans/confirm/refund)
    @PostMapping("/delaytrans/confirm/refund")
    public ResponseEntity<Map<String, Object>> delaytransConfirmRefund(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("延时交易-交易确认退款", "v2/trade/payment/delaytrans/confirm/refund", params);
        return ResponseEntity.ok(resp);
    }

    // 26. 交易确认退款查询 (v2/trade/payment/delaytrans/confirm/refund/query)
    @PostMapping("/delaytrans/confirm/refund/query")
    public ResponseEntity<Map<String, Object>> delaytransConfirmRefundQuery(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("延时交易-交易确认退款查询", "v2/trade/payment/delaytrans/confirm/refund/query", params);
        return ResponseEntity.ok(resp);
    }

    // ================= 结算出金 (Settlement & Payout) =================

    // 27. 主动取现 (v2/trade/settlement/encash)
    @PostMapping("/settlement/encash")
    public ResponseEntity<Map<String, Object>> settlementEncash(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("结算出金-主动取现", "v2/trade/settlement/encash", params);
        return ResponseEntity.ok(resp);
    }

    // 28. 资金代发 (v2/trade/settlement/transfer)
    @PostMapping("/settlement/transfer")
    public ResponseEntity<Map<String, Object>> settlementTransfer(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("结算出金-资金代发", "v2/trade/settlement/transfer", params);
        return ResponseEntity.ok(resp);
    }

    // 29. 取现&代发查询 (v2/trade/settlement/encash/query)
    @PostMapping("/settlement/encash/query")
    public ResponseEntity<Map<String, Object>> settlementEncashQuery(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("结算出金-取现代发查询", "v2/trade/settlement/encash/query", params);
        return ResponseEntity.ok(resp);
    }

    // 30. 批量取现&代发查询 (v2/trade/settlement/batch/query)
    @PostMapping("/settlement/batch/query")
    public ResponseEntity<Map<String, Object>> settlementBatchQuery(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("结算出金-批量取现代发查询", "v2/trade/settlement/batch/query", params);
        return ResponseEntity.ok(resp);
    }

    // 31. 结算明细查询 (v2/trade/settlement/query)
    @PostMapping("/settlement/query")
    public ResponseEntity<Map<String, Object>> settlementQuery(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("结算出金-结算查询", "v2/trade/settlement/query", params);
        return ResponseEntity.ok(resp);
    }

    // 32. DM取现额度查询 (v2/trade/settlement/quota/query)
    @PostMapping("/settlement/quota/query")
    public ResponseEntity<Map<String, Object>> settlementQuotaQuery(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("结算出金-DM取现额度查询", "v2/trade/settlement/quota/query", params);
        return ResponseEntity.ok(resp);
    }

    // 33. 手续费试算 (v2/trade/settlement/fee/calculate)
    @PostMapping("/settlement/fee/calculate")
    public ResponseEntity<Map<String, Object>> settlementFeeCalculate(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("结算出金-手续费试算", "v2/trade/settlement/fee/calculate", params);
        return ResponseEntity.ok(resp);
    }

    // 34. 对公打款验证确认 (v2/merchant/busi/remit/confirm)
    @PostMapping("/merchant/remit/confirm")
    public ResponseEntity<Map<String, Object>> merchantRemitConfirm(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("结算出金-对公打款验证确认", "v2/merchant/busi/remit/confirm", params);
        return ResponseEntity.ok(resp);
    }

    // ================= 用户进件 (User Onboarding) =================

    // 35. 企业用户基本信息开户 (v2/user/busi/company/open)
    @PostMapping("/user/company/open")
    public ResponseEntity<Map<String, Object>> userCompanyOpen(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("用户进件-企业用户基本信息开户", "v2/user/busi/company/open", params);
        return ResponseEntity.ok(resp);
    }

    // 36. 企业用户基本信息修改 (v2/user/busi/company/modify)
    @PostMapping("/user/company/modify")
    public ResponseEntity<Map<String, Object>> userCompanyModify(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("用户进件-企业用户基本信息修改", "v2/user/busi/company/modify", params);
        return ResponseEntity.ok(resp);
    }

    // 37. 个人用户基本信息开户 (v2/user/busi/indv/open)
    @PostMapping("/user/indv/open")
    public ResponseEntity<Map<String, Object>> userIndvOpen(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("用户进件-个人用户基本信息开户", "v2/user/busi/indv/open", params);
        return ResponseEntity.ok(resp);
    }

    // 38. 个人用户基本信息修改 (v2/user/busi/indv/modify)
    @PostMapping("/user/indv/modify")
    public ResponseEntity<Map<String, Object>> userIndvModify(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("用户进件-个人用户基本信息修改", "v2/user/busi/indv/modify", params);
        return ResponseEntity.ok(resp);
    }

    // 39. 用户业务入驻 (v2/user/busi/open)
    @PostMapping("/user/busi/open")
    public ResponseEntity<Map<String, Object>> userBusiOpen(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("用户进件-用户业务入驻", "v2/user/busi/open", params);
        return ResponseEntity.ok(resp);
    }

    // 40. 用户业务入驻修改 (v2/user/busi/modify)
    @PostMapping("/user/busi/modify")
    public ResponseEntity<Map<String, Object>> userBusiModify(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("用户进件-用户业务入驻修改", "v2/user/busi/modify", params);
        return ResponseEntity.ok(resp);
    }

    // 41. 用户信息查询 (v2/user/busi/query)
    @PostMapping("/user/busi/query")
    public ResponseEntity<Map<String, Object>> userBusiQuery(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("用户进件-用户信息查询", "v2/user/busi/query", params);
        return ResponseEntity.ok(resp);
    }

    // 42. 用户列表查询 (v2/user/busi/list/query)
    @PostMapping("/user/busi/list/query")
    public ResponseEntity<Map<String, Object>> userBusiListQuery(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("用户进件-用户列表查询", "v2/user/busi/list/query", params);
        return ResponseEntity.ok(resp);
    }

    // 43. 用户申请单状态查询 (v2/user/busi/status/query)
    @PostMapping("/user/busi/status/query")
    public ResponseEntity<Map<String, Object>> userBusiStatusQuery(@RequestBody Map<String, Object> params) {
        Map<String, Object> resp = huifuSdkService.executeApi("用户进件-用户申请单状态查询", "v2/user/busi/status/query", params);
        return ResponseEntity.ok(resp);
    }
}
