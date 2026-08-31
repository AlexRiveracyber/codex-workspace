package com.platform.tool.controller;

import com.platform.tool.dto.ApiResponse;
import com.platform.tool.dto.CryptoDTOs.*;
import com.platform.tool.service.ToolCryptoService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/crypto")
public class ToolCryptoController {

    private final ToolCryptoService cryptoService;

    public ToolCryptoController(ToolCryptoService cryptoService) {
        this.cryptoService = cryptoService;
    }

    @PostMapping("/hash")
    public ApiResponse<HashResponse> computeHashes(@RequestBody HashRequest req) {
        return ApiResponse.success(cryptoService.computeHashes(req));
    }

    @PostMapping("/symmetric/encrypt")
    public ApiResponse<SymmetricResponse> encryptSymmetric(@RequestBody SymmetricRequest req) throws Exception {
        return ApiResponse.success(cryptoService.encryptSymmetric(req));
    }

    @PostMapping("/symmetric/decrypt")
    public ApiResponse<SymmetricResponse> decryptSymmetric(@RequestBody SymmetricRequest req) throws Exception {
        return ApiResponse.success(cryptoService.decryptSymmetric(req));
    }

    @GetMapping("/rsa/generate-keypair")
    public ApiResponse<RsaKeyGenResponse> generateRsaKeyPair(@RequestParam(defaultValue = "2048") int keySize) throws Exception {
        return ApiResponse.success(cryptoService.generateRsaKeyPair(keySize));
    }

    @PostMapping("/rsa/sign")
    public ApiResponse<String> rsaSign(@RequestBody RsaSignRequest req) throws Exception {
        return ApiResponse.success("签名成功", cryptoService.rsaSign(req));
    }

    @PostMapping("/rsa/verify")
    public ApiResponse<Boolean> rsaVerify(@RequestBody RsaVerifyRequest req) throws Exception {
        boolean valid = cryptoService.rsaVerify(req);
        return ApiResponse.success(valid ? "验签通过" : "验签失败", valid);
    }

    @GetMapping("/ids/generate")
    public ApiResponse<IdGenResponse> generateIds() {
        return ApiResponse.success(cryptoService.generateIds());
    }
}
