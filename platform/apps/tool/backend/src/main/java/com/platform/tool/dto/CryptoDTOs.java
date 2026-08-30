package com.platform.tool.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

public class CryptoDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HashRequest {
        private String text;
        private String hmacKey;
        private boolean uppercase = false;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HashResponse {
        private String md5;
        private String md5_16;
        private String sha1;
        private String sha224;
        private String sha256;
        private String sha384;
        private String sha512;
        private String sm3;
        private String hmacSha256;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SymmetricRequest {
        private String text;
        private String key;
        private String iv;
        private String algorithm = "AES"; // AES, DES, 3DES, SM4
        private String mode = "CBC";      // CBC, ECB, GCM, CTR
        private String padding = "PKCS5Padding"; // PKCS5Padding, NoPadding
        private String outputFormat = "Base64"; // Base64, Hex
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SymmetricResponse {
        private String result;
        private String algorithm;
        private String mode;
        private String padding;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RsaKeyGenResponse {
        private String publicKey;
        private String privateKey;
        private int keySize;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RsaCryptoRequest {
        private String text;
        private String key;
        private boolean isPublicKey = true;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RsaSignRequest {
        private String content;
        private String privateKey;
        private String algorithm = "SHA256withRSA"; // SHA256withRSA, SHA1withRSA, SM3withSM2
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RsaVerifyRequest {
        private String content;
        private String signature;
        private String publicKey;
        private String algorithm = "SHA256withRSA";
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IdGenResponse {
        private String uuidV4;
        private String uuidV1;
        private String nanoId;
        private Long snowflakeId;
        private String randomPassword;
    }
}
