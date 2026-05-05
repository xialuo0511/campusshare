package com.xialuo.campusshare.common.util;

import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * Signs Redis session values so a raw Redis write is not enough to forge login.
 */
public final class SessionTokenUtil {
    private static final String VERSION = "v1";
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private SessionTokenUtil() {
    }

    public static String BuildSessionValue(String token, Long userId, String signingSecret) {
        String userIdText = String.valueOf(userId);
        return VERSION + ":" + userIdText + ":" + BuildSignature(token, userIdText, signingSecret);
    }

    public static Long ResolveUserId(String token, String sessionValue, String signingSecret) {
        if (token == null || token.isBlank() || sessionValue == null || sessionValue.isBlank()) {
            return null;
        }
        String[] parts = sessionValue.split(":");
        if (parts.length != 3 || !VERSION.equals(parts[0])) {
            return null;
        }
        String userIdText = parts[1];
        String expectedSignature = BuildSignature(token, userIdText, signingSecret);
        if (!expectedSignature.equals(parts[2])) {
            return null;
        }
        try {
            return Long.parseLong(userIdText);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private static String BuildSignature(String token, String userIdText, String signingSecret) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                NormalizeSecret(signingSecret).getBytes(StandardCharsets.UTF_8),
                HMAC_ALGORITHM
            );
            mac.init(secretKeySpec);
            byte[] signature = mac.doFinal((token + ":" + userIdText).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(signature);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to sign session value", exception);
        }
    }

    private static String NormalizeSecret(String signingSecret) {
        String safeSecret = signingSecret == null ? "" : signingSecret.trim();
        if (safeSecret.isBlank()) {
            throw new IllegalStateException("Session signing secret is required");
        }
        return safeSecret;
    }
}
