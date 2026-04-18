package com.xialuo.campusshare.module.admin.bootstrap;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ResourceLoader;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.DatabasePopulatorUtils;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;

/**
 * 系统规则表启动自愈初始化器
 */
@Component
public class SystemRuleConfigBootstrapInitializer {
    /** 日志 */
    private static final Logger LOGGER = LoggerFactory.getLogger(SystemRuleConfigBootstrapInitializer.class);
    /** 规则表名 */
    private static final String SYSTEM_RULE_TABLE_NAME = "system_rule_config";

    /** JDBC模板 */
    private final JdbcTemplate jdbcTemplate;
    /** 资源加载器 */
    private final ResourceLoader resourceLoader;
    /** 自愈开关 */
    private final Boolean ruleBootstrapEnabled;

    public SystemRuleConfigBootstrapInitializer(
        JdbcTemplate jdbcTemplate,
        ResourceLoader resourceLoader,
        @Value("${campusshare.rule.bootstrap.enabled:true}") Boolean ruleBootstrapEnabled
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.resourceLoader = resourceLoader;
        this.ruleBootstrapEnabled = ruleBootstrapEnabled;
    }

    /**
     * 启动时检查并补齐规则表
     */
    @PostConstruct
    public void EnsureSystemRuleTable() {
        if (!Boolean.TRUE.equals(ruleBootstrapEnabled)) {
            return;
        }
        try {
            if (Boolean.TRUE.equals(IsSystemRuleTableExists())) {
                return;
            }
            ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
            populator.setContinueOnError(true);
            populator.addScript(resourceLoader.getResource("classpath:sql/011_init_system_rule_config.sql"));
            DatabasePopulatorUtils.execute(populator, jdbcTemplate.getDataSource());
            LOGGER.info("System rule table bootstrapped by startup initializer");
        } catch (Exception exception) {
            LOGGER.warn("Bootstrap system rule table failed", exception);
        }
    }

    /**
     * 判断规则表是否存在
     */
    private Boolean IsSystemRuleTableExists() {
        Integer count = jdbcTemplate.queryForObject(
            """
                SELECT COUNT(1)
                FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                """,
            Integer.class,
            SYSTEM_RULE_TABLE_NAME
        );
        return count != null && count > 0;
    }
}
