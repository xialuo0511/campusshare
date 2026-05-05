package com.xialuo.campusshare.module.user.util;

import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Password hashing utilities.
 */
public final class PasswordUtil {
    private static final int SALT_LENGTH = 16;
    private static final String BCRYPT_PREFIX = "{bcrypt}";
    private static final BCryptPasswordEncoder BCRYPT_PASSWORD_ENCODER = new BCryptPasswordEncoder();

    private PasswordUtil() {
    }

    public static String HashPassword(String plainPassword) {
        return BCRYPT_PREFIX + BCRYPT_PASSWORD_ENCODER.encode(plainPassword);
    }

    public static boolean NeedsRehash(String storedPasswordHash) {
        return storedPasswordHash == null || !storedPasswordHash.startsWith(BCRYPT_PREFIX);
    }

    public static boolean VerifyPassword(String plainPassword, String storedPasswordHash) {
        if (storedPasswordHash != null && storedPasswordHash.startsWith(BCRYPT_PREFIX)) {
            String bcryptHash = storedPasswordHash.substring(BCRYPT_PREFIX.length());
            return BCRYPT_PASSWORD_ENCODER.matches(plainPassword, bcryptHash);
        }
        return VerifyLegacySha256Password(plainPassword, storedPasswordHash);
    }

    static String HashLegacySha256Password(String plainPassword) {
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

    private static boolean VerifyLegacySha256Password(String plainPassword, String storedPasswordHash) {
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
