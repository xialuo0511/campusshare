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
    /** 审计日志表名 */
    private static final String AUDIT_LOG_TABLE_NAME = "audit_log_info";
    /** 邮件任务表名 */
    private static final String NOTIFICATION_MAIL_TASK_TABLE_NAME = "notification_mail_task";
    /** 规则表脚本 */
    private static final String SYSTEM_RULE_SCRIPT_PATH = "classpath:sql/011_init_system_rule_config.sql";
    /** 审计日志脚本 */
    private static final String AUDIT_LOG_SCRIPT_PATH = "classpath:sql/012_init_audit_log.sql";
    /** 邮件任务脚本 */
    private static final String NOTIFICATION_MAIL_TASK_SCRIPT_PATH = "classpath:sql/013_init_notification_mail_task.sql";

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
     * 启动时检查并补齐补充表
     */
    @PostConstruct
    public void EnsureSupplementalTables() {
        EnsureSystemRuleTable();
        EnsureAuditLogTable();
        EnsureNotificationMailTaskTable();
    }

    /**
     * 检查并补齐规则表
     */
    public boolean EnsureSystemRuleTable() {
        return EnsureTableByScript(
            SYSTEM_RULE_TABLE_NAME,
            SYSTEM_RULE_SCRIPT_PATH,
            "system rule table"
        );
    }

    /**
     * 检查并补齐审计日志表
     */
    public boolean EnsureAuditLogTable() {
        return EnsureTableByScript(
            AUDIT_LOG_TABLE_NAME,
            AUDIT_LOG_SCRIPT_PATH,
            "audit log table"
        );
    }

    /**
     * 检查并补齐邮件任务表
     */
    public boolean EnsureNotificationMailTaskTable() {
        return EnsureTableByScript(
            NOTIFICATION_MAIL_TASK_TABLE_NAME,
            NOTIFICATION_MAIL_TASK_SCRIPT_PATH,
            "notification mail task table"
        );
    }

    /**
     * 执行表自愈脚本
     */
    private boolean EnsureTableByScript(
        String tableName,
        String scriptPath,
        String tableDescription
    ) {
        if (!Boolean.TRUE.equals(ruleBootstrapEnabled)) {
            return Boolean.TRUE.equals(IsTableExists(tableName));
        }
        try {
            if (Boolean.TRUE.equals(IsTableExists(tableName))) {
                return true;
            }
            ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
            populator.setContinueOnError(true);
            populator.addScript(resourceLoader.getResource(scriptPath));
            DatabasePopulatorUtils.execute(populator, jdbcTemplate.getDataSource());
            boolean tableExists = Boolean.TRUE.equals(IsTableExists(tableName));
            if (tableExists) {
                LOGGER.info("{} bootstrapped by startup initializer", tableDescription);
                return true;
            }
            LOGGER.warn("{} bootstrap finished but table still not found", tableDescription);
            return false;
        } catch (Exception exception) {
            LOGGER.warn("Bootstrap {} failed", tableDescription, exception);
            return Boolean.TRUE.equals(IsTableExists(tableName));
        }
    }

    /**
     * 判断表是否存在
     */
    private Boolean IsTableExists(String tableName) {
        Integer count = jdbcTemplate.queryForObject(
            """
                SELECT COUNT(1)
                FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                """,
            Integer.class,
            tableName
        );
        return count != null && count > 0;
    }
}
