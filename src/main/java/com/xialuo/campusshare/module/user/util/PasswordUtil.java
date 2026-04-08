package com.xialuo.campusshare.module.user.util;

import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * 密码工具类
 */
public final class PasswordUtil {
    /** 盐长度 */
    private static final int SALT_LENGTH = 16;

    private PasswordUtil() {
    }

    /**
     * 生成哈希
     */
    public static String HashPassword(String plainPassword) {
        try {
            byte[] salt = new byte[SALT_LENGTH];
            SecureRandom secureRandom = new SecureRandom();
            secureRandom.nextBytes(salt);

            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            messageDigest.update(salt);
            byte[] hash = messageDigest.digest(plainPassword.getBytes(StandardCharsets.UTF_8));

            String saltText = Base64.getEncoder().encodeToString(salt);
            String hashText = Base64.getEncoder().encodeToString(hash);
            return saltText + "$" + hashText;
        } catch (Exception exception) {
            throw new BusinessException(BizCodeEnum.SYSTEM_ERROR, "密码处理失败");
        }
    }

    /**
     * 校验密码
     */
    public static boolean VerifyPassword(String plainPassword, String storedPasswordHash) {
        try {
            if (storedPasswordHash == null || !storedPasswordHash.contains("$")) {
                return false;
            }
            String[] parts = storedPasswordHash.split("\\$");
            if (parts.length != 2) {
                return false;
            }

            byte[] salt = Base64.getDecoder().decode(parts[0]);
            String expectedHash = parts[1];

            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            messageDigest.update(salt);
            byte[] hash = messageDigest.digest(plainPassword.getBytes(StandardCharsets.UTF_8));
            String currentHash = Base64.getEncoder().encodeToString(hash);

            return currentHash.equals(expectedHash);
        } catch (Exception exception) {
            return false;
        }
    }
}
