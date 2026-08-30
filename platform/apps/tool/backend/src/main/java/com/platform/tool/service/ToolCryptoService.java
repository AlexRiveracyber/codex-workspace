package com.platform.tool.service;

import com.platform.tool.dto.CryptoDTOs.*;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.codec.binary.Hex;
import org.apache.commons.codec.digest.DigestUtils;
import org.bouncycastle.crypto.digests.SM3Digest;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class ToolCryptoService {
    private static final Logger log = LoggerFactory.getLogger(ToolCryptoService.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final AtomicLong SNOWFLAKE_SEQUENCE = new AtomicLong(0L);

    static {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    public HashResponse computeHashes(HashRequest req) {
        String text = req.getText() == null ? "" : req.getText();
        byte[] bytes = text.getBytes(StandardCharsets.UTF_8);

        String md5 = DigestUtils.md5Hex(bytes);
        String md5_16 = md5.substring(8, 24);
        String sha1 = DigestUtils.sha1Hex(bytes);
        String sha224 = DigestUtils.sha384Hex(bytes).substring(0, 56);
        String sha256 = DigestUtils.sha256Hex(bytes);
        String sha384 = DigestUtils.sha384Hex(bytes);
        String sha512 = DigestUtils.sha512Hex(bytes);

        // SM3 (Chinese National Standard)
        SM3Digest sm3Digest = new SM3Digest();
        sm3Digest.update(bytes, 0, bytes.length);
        byte[] sm3Result = new byte[sm3Digest.getDigestSize()];
        sm3Digest.doFinal(sm3Result, 0);
        String sm3 = Hex.encodeHexString(sm3Result);

        // HMAC-SHA256 if key provided
        String hmacSha256 = "";
        if (req.getHmacKey() != null && !req.getHmacKey().isEmpty()) {
            try {
                Mac mac = Mac.getInstance("HmacSHA256");
                SecretKeySpec secretKey = new SecretKeySpec(req.getHmacKey().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
                mac.init(secretKey);
                hmacSha256 = Hex.encodeHexString(mac.doFinal(bytes));
            } catch (Exception e) {
                hmacSha256 = "Error: " + e.getMessage();
            }
        }

        if (req.isUppercase()) {
            md5 = md5.toUpperCase();
            md5_16 = md5_16.toUpperCase();
            sha1 = sha1.toUpperCase();
            sha224 = sha224.toUpperCase();
            sha256 = sha256.toUpperCase();
            sha384 = sha384.toUpperCase();
            sha512 = sha512.toUpperCase();
            sm3 = sm3.toUpperCase();
            hmacSha256 = hmacSha256.toUpperCase();
        }

        return HashResponse.builder()
                .md5(md5)
                .md5_16(md5_16)
                .sha1(sha1)
                .sha224(sha224)
                .sha256(sha256)
                .sha384(sha384)
                .sha512(sha512)
                .sm3(sm3)
                .hmacSha256(hmacSha256)
                .build();
    }

    public SymmetricResponse encryptSymmetric(SymmetricRequest req) throws Exception {
        String algo = req.getAlgorithm() == null ? "AES" : req.getAlgorithm().toUpperCase();
        String mode = req.getMode() == null ? "CBC" : req.getMode().toUpperCase();
        String padding = req.getPadding() == null ? "PKCS5Padding" : req.getPadding();
        String transformation = algo + "/" + mode + "/" + padding;

        byte[] keyBytes = formatKey(req.getKey(), algo);
        SecretKeySpec secretKey = new SecretKeySpec(keyBytes, algo.equals("SM4") ? "SM4" : (algo.equals("3DES") ? "DESede" : algo));

        Cipher cipher = algo.equals("SM4") ? Cipher.getInstance("SM4/" + mode + "/" + padding, "BC") : Cipher.getInstance(transformation);

        if ("ECB".equalsIgnoreCase(mode)) {
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);
        } else {
            byte[] ivBytes = formatIv(req.getIv(), algo);
            IvParameterSpec ivSpec = new IvParameterSpec(ivBytes);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, ivSpec);
        }

        byte[] encrypted = cipher.doFinal(req.getText().getBytes(StandardCharsets.UTF_8));
        String result = "Hex".equalsIgnoreCase(req.getOutputFormat()) ? Hex.encodeHexString(encrypted) : Base64.encodeBase64String(encrypted);

        return SymmetricResponse.builder()
                .result(result)
                .algorithm(algo)
                .mode(mode)
                .padding(padding)
                .build();
    }

    public SymmetricResponse decryptSymmetric(SymmetricRequest req) throws Exception {
        String algo = req.getAlgorithm() == null ? "AES" : req.getAlgorithm().toUpperCase();
        String mode = req.getMode() == null ? "CBC" : req.getMode().toUpperCase();
        String padding = req.getPadding() == null ? "PKCS5Padding" : req.getPadding();
        String transformation = algo + "/" + mode + "/" + padding;

        byte[] cipherData;
        if ("Hex".equalsIgnoreCase(req.getOutputFormat()) || req.getText().matches("^[0-9a-fA-F]+$")) {
            cipherData = Hex.decodeHex(req.getText());
        } else {
            cipherData = Base64.decodeBase64(req.getText());
        }

        byte[] keyBytes = formatKey(req.getKey(), algo);
        SecretKeySpec secretKey = new SecretKeySpec(keyBytes, algo.equals("SM4") ? "SM4" : (algo.equals("3DES") ? "DESede" : algo));

        Cipher cipher = algo.equals("SM4") ? Cipher.getInstance("SM4/" + mode + "/" + padding, "BC") : Cipher.getInstance(transformation);

        if ("ECB".equalsIgnoreCase(mode)) {
            cipher.init(Cipher.DECRYPT_MODE, secretKey);
        } else {
            byte[] ivBytes = formatIv(req.getIv(), algo);
            IvParameterSpec ivSpec = new IvParameterSpec(ivBytes);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, ivSpec);
        }

        byte[] decrypted = cipher.doFinal(cipherData);
        return SymmetricResponse.builder()
                .result(new String(decrypted, StandardCharsets.UTF_8))
                .algorithm(algo)
                .mode(mode)
                .padding(padding)
                .build();
    }

    public RsaKeyGenResponse generateRsaKeyPair(int keySize) throws Exception {
        if (keySize != 1024 && keySize != 2048 && keySize != 4096) {
            keySize = 2048;
        }
        KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
        keyGen.initialize(keySize, RANDOM);
        KeyPair pair = keyGen.generateKeyPair();

        String pubKey = Base64.encodeBase64String(pair.getPublic().getEncoded());
        String privKey = Base64.encodeBase64String(pair.getPrivate().getEncoded());

        return RsaKeyGenResponse.builder()
                .publicKey(pubKey)
                .privateKey(privKey)
                .keySize(keySize)
                .build();
    }

    public String rsaSign(RsaSignRequest req) throws Exception {
        byte[] privKeyBytes = Base64.decodeBase64(cleanPem(req.getPrivateKey()));
        PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(privKeyBytes);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        PrivateKey privateKey = keyFactory.generatePrivate(keySpec);

        Signature signature = Signature.getInstance(req.getAlgorithm() != null ? req.getAlgorithm() : "SHA256withRSA");
        signature.initSign(privateKey);
        signature.update(req.getContent().getBytes(StandardCharsets.UTF_8));
        return Base64.encodeBase64String(signature.sign());
    }

    public boolean rsaVerify(RsaVerifyRequest req) throws Exception {
        byte[] pubKeyBytes = Base64.decodeBase64(cleanPem(req.getPublicKey()));
        X509EncodedKeySpec keySpec = new X509EncodedKeySpec(pubKeyBytes);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        PublicKey publicKey = keyFactory.generatePublic(keySpec);

        Signature signature = Signature.getInstance(req.getAlgorithm() != null ? req.getAlgorithm() : "SHA256withRSA");
        signature.initVerify(publicKey);
        signature.update(req.getContent().getBytes(StandardCharsets.UTF_8));
        return signature.verify(Base64.decodeBase64(req.getSignature()));
    }

    public IdGenResponse generateIds() {
        String uuidV4 = UUID.randomUUID().toString();
        String uuidV1 = new UUID(System.currentTimeMillis() << 32 | (System.nanoTime() & 0xFFFFFFFFL), RANDOM.nextLong()).toString();

        // NanoID (21 chars standard)
        char[] nanoAlphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-".toCharArray();
        StringBuilder nanoId = new StringBuilder();
        for (int i = 0; i < 21; i++) {
            nanoId.append(nanoAlphabet[RANDOM.nextInt(nanoAlphabet.length)]);
        }

        // Snowflake ID (64-bit ID simulation)
        long timestamp = System.currentTimeMillis() - 1700000000000L;
        long datacenterId = 1L;
        long workerId = 1L;
        long seq = SNOWFLAKE_SEQUENCE.incrementAndGet() & 0xFFFL;
        long snowflake = (timestamp << 22) | (datacenterId << 17) | (workerId << 12) | seq;

        // Strong random password
        String upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        String lower = "abcdefghjkmnpqrstuvwxyz";
        String digits = "23456789";
        String special = "!@#$%^&*()_+~=";
        String all = upper + lower + digits + special;
        StringBuilder password = new StringBuilder();
        password.append(upper.charAt(RANDOM.nextInt(upper.length())));
        password.append(lower.charAt(RANDOM.nextInt(lower.length())));
        password.append(digits.charAt(RANDOM.nextInt(digits.length())));
        password.append(special.charAt(RANDOM.nextInt(special.length())));
        for (int i = 4; i < 16; i++) {
            password.append(all.charAt(RANDOM.nextInt(all.length())));
        }

        return IdGenResponse.builder()
                .uuidV4(uuidV4)
                .uuidV1(uuidV1)
                .nanoId(nanoId.toString())
                .snowflakeId(snowflake)
                .randomPassword(password.toString())
                .build();
    }

    private String cleanPem(String key) {
        if (key == null) return "";
        return key.replaceAll("-----BEGIN [A-Z ]+-----", "")
                .replaceAll("-----END [A-Z ]+-----", "")
                .replaceAll("\\s+", "");
    }

    private byte[] formatKey(String key, String algo) {
        if (key == null) key = "1234567890123456";
        byte[] bytes = key.getBytes(StandardCharsets.UTF_8);
        int targetLen = 16;
        if ("3DES".equalsIgnoreCase(algo)) targetLen = 24;
        if ("DES".equalsIgnoreCase(algo)) targetLen = 8;
        if ("SM4".equalsIgnoreCase(algo)) targetLen = 16;
        if ("AES".equalsIgnoreCase(algo)) {
            targetLen = (bytes.length > 24) ? 32 : (bytes.length > 16 ? 24 : 16);
        }
        byte[] result = new byte[targetLen];
        System.arraycopy(bytes, 0, result, 0, Math.min(bytes.length, targetLen));
        return result;
    }

    private byte[] formatIv(String iv, String algo) {
        if (iv == null || iv.isEmpty()) iv = "1234567890123456";
        byte[] bytes = iv.getBytes(StandardCharsets.UTF_8);
        int targetLen = "DES".equalsIgnoreCase(algo) ? 8 : 16;
        byte[] result = new byte[targetLen];
        System.arraycopy(bytes, 0, result, 0, Math.min(bytes.length, targetLen));
        return result;
    }
}
