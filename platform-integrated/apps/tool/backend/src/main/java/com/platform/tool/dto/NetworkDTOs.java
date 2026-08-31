package com.platform.tool.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

public class NetworkDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PortCheckRequest {
        private String host;
        private int port;
        private int timeoutMs = 3000;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PortCheckResponse {
        private String host;
        private int port;
        private boolean open;
        private long latencyMs;
        private String message;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CidrCalcRequest {
        private String cidr; // e.g. 192.168.1.0/24
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CidrCalcResponse {
        private String ip;
        private int maskBits;
        private String netmask;
        private String wildcardMask;
        private String networkAddress;
        private String broadcastAddress;
        private String minHost;
        private String maxHost;
        private long totalHosts;
        private long usableHosts;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HttpRequestDto {
        private String url;
        private String method = "GET";
        private Map<String, String> headers;
        private Map<String, String> params;
        private String body;
        private int timeoutMs = 10000;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HttpResponseDto {
        private int statusCode;
        private String statusText;
        private Map<String, String> headers;
        private String body;
        private long responseTimeMs;
        private long sizeBytes;
        private String error;
    }
}
