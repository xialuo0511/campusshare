package com.xialuo.campusshare.module.statistics.service.impl;

import com.xialuo.campusshare.module.statistics.dto.SystemHealthResponseDto;
import com.xialuo.campusshare.module.statistics.service.SystemHealthService;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.core.env.Environment;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * 系统健康服务实现
 */
@Service
public class SystemHealthServiceImpl implements SystemHealthService {
    /** 健康状态-正常 */
    private static final String HEALTH_STATUS_UP = "UP";
    /** 健康状态-异常 */
    private static final String HEALTH_STATUS_DOWN = "DOWN";
    /** 健康状态-降级 */
    private static final String HEALTH_STATUS_DEGRADED = "DEGRADED";

    /** JDBC模板 */
    private final JdbcTemplate jdbcTemplate;
    /** Redis模板 */
    private final StringRedisTemplate stringRedisTemplate;
    /** 环境配置 */
    private final Environment environment;

    public SystemHealthServiceImpl(
        JdbcTemplate jdbcTemplate,
        StringRedisTemplate stringRedisTemplate,
        Environment environment
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.stringRedisTemplate = stringRedisTemplate;
        this.environment = environment;
    }

    @Override
    public SystemHealthResponseDto GetSystemHealth() {
        String databaseStatus = ResolveDatabaseStatus();
        String redisStatus = ResolveRedisStatus();
        String overallStatus = ResolveOverallStatus(databaseStatus, redisStatus);

        SystemHealthResponseDto responseDto = new SystemHealthResponseDto();
        responseDto.SetAppName(environment.getProperty("spring.application.name", "campusshare"));
        responseDto.SetEnvironment(ResolveActiveProfile());
        responseDto.SetOverallStatus(overallStatus);
        responseDto.SetDatabaseStatus(databaseStatus);
        responseDto.SetRedisStatus(redisStatus);
        responseDto.SetCheckTime(LocalDateTime.now());
        return responseDto;
    }

    /**
     * 数据库状态
     */
    private String ResolveDatabaseStatus() {
        try {
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            if (result != null && result == 1) {
                return HEALTH_STATUS_UP;
            }
            return HEALTH_STATUS_DOWN;
        } catch (Exception exception) {
            return HEALTH_STATUS_DOWN;
        }
    }

    /**
     * Redis状态
     */
    private String ResolveRedisStatus() {
        try {
            String pong = stringRedisTemplate.execute((RedisConnection redisConnection) -> redisConnection.ping());
            if ("PONG".equalsIgnoreCase(pong)) {
                return HEALTH_STATUS_UP;
            }
            return HEALTH_STATUS_DOWN;
        } catch (Exception exception) {
            return HEALTH_STATUS_DOWN;
        }
    }

    /**
     * 总体状态
     */
    private String ResolveOverallStatus(String databaseStatus, String redisStatus) {
        if (HEALTH_STATUS_UP.equals(databaseStatus) && HEALTH_STATUS_UP.equals(redisStatus)) {
            return HEALTH_STATUS_UP;
        }
        if (HEALTH_STATUS_UP.equals(databaseStatus) || HEALTH_STATUS_UP.equals(redisStatus)) {
            return HEALTH_STATUS_DEGRADED;
        }
        return HEALTH_STATUS_DOWN;
    }

    /**
     * 解析生效环境
     */
    private String ResolveActiveProfile() {
        String[] activeProfiles = environment.getActiveProfiles();
        if (activeProfiles == null || activeProfiles.length == 0) {
            return "default";
        }
        return Optional.ofNullable(activeProfiles[0]).orElse("default");
    }
}

