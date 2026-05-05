package com.xialuo.campusshare.common.config;

import java.util.Arrays;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * Fails fast when production starts with unsafe defaults.
 */
@Component
public class ProductionSafetyConfig implements ApplicationRunner {
    private static final String DEFAULT_SESSION_SECRET = "dev-session-signing-secret-change-me";
    private static final String EXAMPLE_SESSION_SECRET = "please_change_this_session_signing_secret";
    private static final String EXAMPLE_REDIS_PASSWORD = "please_change_this_redis_password";
    private static final String DEFAULT_MYSQL_PASSWORD = "please_change_this_password";

    private final Environment environment;

    public ProductionSafetyConfig(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!IsProductionProfile()) {
            return;
        }
        RequireNotDefault(
            "spring.data.redis.password",
            EXAMPLE_REDIS_PASSWORD,
            "REDIS_PASSWORD must be set to a non-example value in prod"
        );
        RequireNotDefault(
            "campusshare.session.signing-secret",
            DEFAULT_SESSION_SECRET,
            "SESSION_SIGNING_SECRET must be changed in prod"
        );
        RequireNotDefault(
            "campusshare.session.signing-secret",
            EXAMPLE_SESSION_SECRET,
            "SESSION_SIGNING_SECRET must be changed in prod"
        );
        RequireNotDefault(
            "spring.datasource.password",
            DEFAULT_MYSQL_PASSWORD,
            "DATASOURCE_PASSWORD/MYSQL_ROOT_PASSWORD must be changed in prod"
        );
        RequireEquals(
            "campusshare.mail.register.log-code-enabled",
            "false",
            "REGISTER_CODE_LOG_ENABLED must be false in prod"
        );
    }

    private boolean IsProductionProfile() {
        return Arrays.stream(environment.getActiveProfiles()).anyMatch("prod"::equalsIgnoreCase);
    }

    private void RequireNonBlank(String propertyName, String message) {
        String value = environment.getProperty(propertyName, "");
        if (value == null || value.trim().isBlank()) {
            throw new IllegalStateException(message);
        }
    }

    private void RequireNotDefault(String propertyName, String defaultValue, String message) {
        String value = environment.getProperty(propertyName, "");
        if (value == null || value.trim().isBlank() || defaultValue.equals(value.trim())) {
            throw new IllegalStateException(message);
        }
    }

    private void RequireEquals(String propertyName, String expectedValue, String message) {
        String value = environment.getProperty(propertyName, "");
        if (!expectedValue.equalsIgnoreCase(value == null ? "" : value.trim())) {
            throw new IllegalStateException(message);
        }
    }
}
