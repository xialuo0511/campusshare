package com.xialuo.campusshare.module.user.util;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class PasswordUtilTest {
    @Test
    void HashPasswordShouldUseBcryptAndVerify() {
        String passwordHash = PasswordUtil.HashPassword("secret-123456");

        Assertions.assertTrue(passwordHash.startsWith("{bcrypt}"));
        Assertions.assertTrue(PasswordUtil.VerifyPassword("secret-123456", passwordHash));
        Assertions.assertFalse(PasswordUtil.VerifyPassword("wrong-password", passwordHash));
        Assertions.assertFalse(PasswordUtil.NeedsRehash(passwordHash));
    }

    @Test
    void LegacySha256HashShouldStillVerifyAndNeedRehash() {
        String legacyHash = PasswordUtil.HashLegacySha256Password("secret-123456");

        Assertions.assertTrue(PasswordUtil.VerifyPassword("secret-123456", legacyHash));
        Assertions.assertFalse(PasswordUtil.VerifyPassword("wrong-password", legacyHash));
        Assertions.assertTrue(PasswordUtil.NeedsRehash(legacyHash));
    }
}
