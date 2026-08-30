package com.platform.tool.service;

import com.platform.tool.dto.NetworkDTOs.*;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Service
public class ToolNetworkService {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    public PortCheckResponse checkPort(PortCheckRequest req) {
        String host = req.getHost();
        int port = req.getPort();
        int timeout = req.getTimeoutMs() > 0 ? req.getTimeoutMs() : 3000;

        if (StringUtils.isBlank(host)) {
            return PortCheckResponse.builder()
                    .host(host)
                    .port(port)
                    .open(false)
                    .message("Host 不能为空")
                    .build();
        }

        long start = System.currentTimeMillis();
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), timeout);
            long latency = System.currentTimeMillis() - start;
            return PortCheckResponse.builder()
                    .host(host)
                    .port(port)
                    .open(true)
                    .latencyMs(latency)
                    .message("端口开放，连接成功 (耗时: " + latency + "ms)")
                    .build();
        } catch (Exception e) {
            long latency = System.currentTimeMillis() - start;
            return PortCheckResponse.builder()
                    .host(host)
                    .port(port)
                    .open(false)
                    .latencyMs(latency)
                    .message("连接失败: " + e.getMessage())
                    .build();
        }
    }

    public CidrCalcResponse calculateCidr(CidrCalcRequest req) {
        String cidr = req.getCidr();
        if (StringUtils.isBlank(cidr) || !cidr.contains("/")) {
            throw new IllegalArgumentException("CIDR 格式应形如: 192.168.1.0/24");
        }

        String[] parts = cidr.trim().split("/");
        String ipStr = parts[0].trim();
        int prefix = Integer.parseInt(parts[1].trim());

        if (prefix < 0 || prefix > 32) {
            throw new IllegalArgumentException("CIDR 前缀必须在 0 到 32 之间");
        }

        long ip = ipToLong(ipStr);
        long mask = (0xFFFFFFFFL << (32 - prefix)) & 0xFFFFFFFFL;
        long wildcard = ~mask & 0xFFFFFFFFL;
        long network = ip & mask;
        long broadcast = network | wildcard;

        long totalHosts = (long) Math.pow(2, 32 - prefix);
        long usableHosts = prefix >= 31 ? (prefix == 31 ? 2 : 1) : Math.max(0, totalHosts - 2);

        long minHost = prefix >= 31 ? network : network + 1;
        long maxHost = prefix >= 31 ? broadcast : broadcast - 1;

        return CidrCalcResponse.builder()
                .ip(ipStr)
                .maskBits(prefix)
                .netmask(longToIp(mask))
                .wildcardMask(longToIp(wildcard))
                .networkAddress(longToIp(network))
                .broadcastAddress(longToIp(broadcast))
                .minHost(longToIp(minHost))
                .maxHost(longToIp(maxHost))
                .totalHosts(totalHosts)
                .usableHosts(usableHosts)
                .build();
    }

    public HttpResponseDto sendHttpRequest(HttpRequestDto req) {
        String url = req.getUrl();
        if (StringUtils.isBlank(url)) {
            return HttpResponseDto.builder()
                    .statusCode(400)
                    .error("请求 URL 不能为空")
                    .build();
        }

        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "http://" + url;
        }

        // Append query params if any
        if (req.getParams() != null && !req.getParams().isEmpty()) {
            StringBuilder query = new StringBuilder(url.contains("?") ? "&" : "?");
            req.getParams().forEach((k, v) -> query.append(k).append("=").append(v).append("&"));
            url += query.substring(0, query.length() - 1);
        }

        try {
            HttpRequest.Builder httpReqBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofMillis(req.getTimeoutMs() > 0 ? req.getTimeoutMs() : 10000));

            // Set Headers
            if (req.getHeaders() != null) {
                req.getHeaders().forEach((k, v) -> {
                    if (StringUtils.isNotBlank(k) && StringUtils.isNotBlank(v) && !k.equalsIgnoreCase("host") && !k.equalsIgnoreCase("content-length")) {
                        try {
                            httpReqBuilder.header(k, v);
                        } catch (Exception ignored) {}
                    }
                });
            }

            String method = StringUtils.defaultIfBlank(req.getMethod(), "GET").toUpperCase();
            HttpRequest.BodyPublisher bodyPublisher = StringUtils.isNotBlank(req.getBody())
                    ? HttpRequest.BodyPublishers.ofString(req.getBody())
                    : HttpRequest.BodyPublishers.noBody();

            switch (method) {
                case "POST" -> httpReqBuilder.POST(bodyPublisher);
                case "PUT" -> httpReqBuilder.PUT(bodyPublisher);
                case "DELETE" -> httpReqBuilder.DELETE();
                case "PATCH" -> httpReqBuilder.method("PATCH", bodyPublisher);
                case "HEAD" -> httpReqBuilder.method("HEAD", HttpRequest.BodyPublishers.noBody());
                default -> httpReqBuilder.GET();
            }

            long start = System.currentTimeMillis();
            HttpResponse<String> response = httpClient.send(httpReqBuilder.build(), HttpResponse.BodyHandlers.ofString());
            long latency = System.currentTimeMillis() - start;

            Map<String, String> respHeaders = new HashMap<>();
            response.headers().map().forEach((k, v) -> respHeaders.put(k, String.join(", ", v)));

            String respBody = response.body();
            return HttpResponseDto.builder()
                    .statusCode(response.statusCode())
                    .statusText("HTTP " + response.statusCode())
                    .headers(respHeaders)
                    .body(respBody)
                    .responseTimeMs(latency)
                    .sizeBytes(respBody != null ? respBody.getBytes().length : 0)
                    .build();

        } catch (Exception e) {
            return HttpResponseDto.builder()
                    .statusCode(500)
                    .error("请求失败: " + e.getMessage())
                    .build();
        }
    }

    private long ipToLong(String ipAddress) {
        String[] ipAddressInArray = ipAddress.split("\\.");
        long result = 0;
        for (int i = 0; i < 4; i++) {
            long power = 3 - i;
            int ip = Integer.parseInt(ipAddressInArray[i]);
            result += (ip * Math.pow(256, power));
        }
        return result;
    }

    private String longToIp(long i) {
        return ((i >> 24) & 0xFF) + "." +
                ((i >> 16) & 0xFF) + "." +
                ((i >> 8) & 0xFF) + "." +
                (i & 0xFF);
    }
}
