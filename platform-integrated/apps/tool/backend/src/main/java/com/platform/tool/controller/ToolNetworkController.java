package com.platform.tool.controller;

import com.platform.tool.dto.ApiResponse;
import com.platform.tool.dto.NetworkDTOs.*;
import com.platform.tool.service.ToolNetworkService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/network")
public class ToolNetworkController {

    private final ToolNetworkService networkService;

    public ToolNetworkController(ToolNetworkService networkService) {
        this.networkService = networkService;
    }

    @PostMapping("/port-check")
    public ApiResponse<PortCheckResponse> checkPort(@RequestBody PortCheckRequest req) {
        return ApiResponse.success(networkService.checkPort(req));
    }

    @PostMapping("/cidr-calc")
    public ApiResponse<CidrCalcResponse> calculateCidr(@RequestBody CidrCalcRequest req) {
        return ApiResponse.success(networkService.calculateCidr(req));
    }

    @PostMapping("/http-request")
    public ApiResponse<HttpResponseDto> sendHttpRequest(@RequestBody HttpRequestDto req) {
        return ApiResponse.success(networkService.sendHttpRequest(req));
    }
}
