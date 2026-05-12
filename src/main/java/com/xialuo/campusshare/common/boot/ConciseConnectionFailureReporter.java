package com.xialuo.campusshare.common.boot;

import org.springframework.boot.SpringBootExceptionReporter;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.jdbc.CannotGetJdbcConnectionException;

/**
 * Prints a short startup hint for unavailable infrastructure instead of a long stack trace.
 */
public class ConciseConnectionFailureReporter implements SpringBootExceptionReporter {

    private static final String DATASOURCE_URL_KEY = "spring.datasource.url";
    private static final String REDIS_HOST_KEY = "spring.data.redis.host";
    private static final String REDIS_PORT_KEY = "spring.data.redis.port";

    private final ConfigurableApplicationContext context;

    public ConciseConnectionFailureReporter(ConfigurableApplicationContext context) {
        this.context = context;
    }

    @Override
    public boolean reportException(Throwable failure) {
        if (containsMysqlConnectionFailure(failure)) {
            String url = getProperty(DATASOURCE_URL_KEY, "jdbc:mysql://localhost:3306/campusshare");
            printMessage(
                    "MySQL",
                    "无法连接到数据库：" + url,
                    "请确认 MySQL 已启动、端口可访问，并检查 DATASOURCE_URL / DATASOURCE_USERNAME / DATASOURCE_PASSWORD。"
            );
            return true;
        }
        if (containsRedisConnectionFailure(failure)) {
            String host = getProperty(REDIS_HOST_KEY, "localhost");
            String port = getProperty(REDIS_PORT_KEY, "6379");
            printMessage(
                    "Redis",
                    "无法连接到 Redis：" + host + ":" + port,
                    "请确认 Redis 已启动、端口可访问，并检查 REDIS_HOST / REDIS_PORT / REDIS_PASSWORD。"
            );
            return true;
        }
        return false;
    }

    private boolean containsMysqlConnectionFailure(Throwable failure) {
        return containsCause(failure, CannotGetJdbcConnectionException.class)
                || containsCause(failure, DataAccessResourceFailureException.class)
                || containsCauseName(failure, "com.mysql.cj.jdbc.exceptions.CommunicationsException")
                || containsCauseName(failure, "com.mysql.cj.exceptions.CJCommunicationsException");
    }

    private boolean containsRedisConnectionFailure(Throwable failure) {
        return containsCauseName(failure, "org.springframework.data.redis.RedisConnectionFailureException")
                || containsCauseName(failure, "io.lettuce.core.RedisConnectionException");
    }

    private boolean containsCause(Throwable failure, Class<? extends Throwable> causeType) {
        Throwable current = failure;
        while (current != null) {
            if (causeType.isInstance(current)) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }

    private boolean containsCauseName(Throwable failure, String causeClassName) {
        Throwable current = failure;
        while (current != null) {
            if (current.getClass().getName().equals(causeClassName)) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }

    private String getProperty(String key, String defaultValue) {
        if (context == null || context.getEnvironment() == null) {
            return defaultValue;
        }
        return context.getEnvironment().getProperty(key, defaultValue);
    }

    private void printMessage(String dependency, String reason, String suggestion) {
        System.err.println();
        System.err.println("========================================");
        System.err.println("CampusShare 启动失败：" + dependency + " 连接不可用");
        System.err.println("----------------------------------------");
        System.err.println(reason);
        System.err.println(suggestion);
        System.err.println("========================================");
        System.err.println();
    }
}
