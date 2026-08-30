package com.platform.task;

import java.lang.reflect.Field;
import java.util.*;

public class InspectSdkRequests {
    public static void main(String[] args) {
        String[] classNames = {
            "com.huifu.bspay.sdk.opps.core.request.V2TradePaymentJspayRequest",
            "com.huifu.bspay.sdk.opps.core.request.V2TradePaymentMicropayRequest",
            "com.huifu.bspay.sdk.opps.core.request.V2TradePaymentScanpayQueryRequest",
            "com.huifu.bspay.sdk.opps.core.request.V2TradePaymentScanpayRefundRequest",
            "com.huifu.bspay.sdk.opps.core.request.V2TradePaymentScanpayRefundqueryRequest",
            "com.huifu.bspay.sdk.opps.core.request.V2TradePaymentDelaytransConfirmRequest",
            "com.huifu.bspay.sdk.opps.core.request.V2TradePaymentDelaytransConfirmQueryRequest",
            "com.huifu.bspay.sdk.opps.core.request.V2TradePaymentDelaytransConfirmRefundRequest",
            "com.huifu.bspay.sdk.opps.core.request.V2TradePaymentDelaytransConfirmRefundQueryRequest",
            "com.huifu.bspay.sdk.opps.core.request.V2TradeSettlementEncashRequest",
            "com.huifu.bspay.sdk.opps.core.request.V2TradeSettlementTransferRequest",
            "com.huifu.bspay.sdk.opps.core.request.V2TradeSettlementEncashQueryRequest",
            "com.huifu.bspay.sdk.opps.core.request.V2TradeSettlementBatchQueryRequest",
            "com.huifu.bspay.sdk.opps.core.request.V2TradeSettlementQueryRequest",
            "com.huifu.bspay.sdk.opps.core.request.V2TradeSettlementQuotaQueryRequest",
            "com.huifu.bspay.sdk.opps.core.request.V2TradeSettlementFeeCalculateRequest",
            "com.huifu.bspay.sdk.opps.core.request.V2MerchantBusiRemitConfirmRequest"
        };

        for (String cname : classNames) {
            try {
                Class<?> clazz = Class.forName(cname);
                System.out.println("=== CLASS: " + clazz.getSimpleName() + " ===");
                List<Field> allFields = new ArrayList<>();
                Class<?> cur = clazz;
                while (cur != null && cur != Object.class) {
                    allFields.addAll(Arrays.asList(cur.getDeclaredFields()));
                    cur = cur.getSuperclass();
                }
                for (Field f : allFields) {
                    if ("serialVersionUID".equals(f.getName())) continue;
                    System.out.println("  " + f.getName() + " (" + f.getType().getSimpleName() + ")");
                }
            } catch (Exception e) {
                System.out.println("Could not load " + cname + ": " + e.getMessage());
            }
        }
    }
}
