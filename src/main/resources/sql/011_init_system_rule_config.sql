CREATE TABLE IF NOT EXISTS system_rule_config (
    rule_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'rule id',
    rule_key VARCHAR(100) NOT NULL COMMENT 'rule key',
    rule_value VARCHAR(500) NOT NULL COMMENT 'rule value',
    rule_type VARCHAR(20) NOT NULL COMMENT 'rule type',
    rule_desc VARCHAR(255) NULL COMMENT 'rule description',
    create_time DATETIME NOT NULL COMMENT 'create time',
    update_time DATETIME NOT NULL COMMENT 'update time',
    deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'deleted flag',
    UNIQUE KEY uk_rule_key (rule_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='system rules';

INSERT INTO system_rule_config (
    rule_key,
    rule_value,
    rule_type,
    rule_desc,
    create_time,
    update_time,
    deleted
) VALUES
    ('MATERIAL_REVIEW_REQUIRED', 'true', 'BOOLEAN', 'material upload requires review', NOW(), NOW(), 0),
    ('PRODUCT_REVIEW_REQUIRED', 'true', 'BOOLEAN', 'product publish requires review', NOW(), NOW(), 0),
    ('TEAM_RECRUITMENT_REVIEW_REQUIRED', 'true', 'BOOLEAN', 'team recruitment publish requires review', NOW(), NOW(), 0),
    ('MATERIAL_UPLOAD_REWARD_POINTS', '2', 'INTEGER', 'material upload reward points', NOW(), NOW(), 0),
    ('MATERIAL_DOWNLOAD_COST_POINTS', '1', 'INTEGER', 'material download cost points', NOW(), NOW(), 0),
    ('MATERIAL_FILE_MAX_SIZE_MB', '25', 'INTEGER', 'material file max size in MB', NOW(), NOW(), 0),
    ('MATERIAL_FILE_ALLOWED_EXTENSIONS', 'jpg,jpeg,png,pdf', 'STRING', 'material file allowed extensions', NOW(), NOW(), 0),
    ('ORDER_AUTO_CLOSE_ENABLED', 'true', 'BOOLEAN', 'enable order timeout auto close', NOW(), NOW(), 0),
    ('ORDER_PENDING_SELLER_CONFIRM_TIMEOUT_MINUTES', '1440', 'INTEGER', 'pending seller confirm timeout minutes', NOW(), NOW(), 0),
    ('ORDER_PENDING_BUYER_CONFIRM_TIMEOUT_MINUTES', '2880', 'INTEGER', 'pending buyer confirm timeout minutes', NOW(), NOW(), 0),
    ('ORDER_AUTO_CLOSE_BATCH_SIZE', '100', 'INTEGER', 'order auto close batch size', NOW(), NOW(), 0),
    ('MAIL_NOTIFICATION_ENABLED', 'false', 'BOOLEAN', 'enable mail notification', NOW(), NOW(), 0),
    ('MAIL_NOTIFICATION_MAX_RETRY', '3', 'INTEGER', 'mail max retry times', NOW(), NOW(), 0),
    ('MAIL_NOTIFICATION_RETRY_INTERVAL_MINUTES', '15', 'INTEGER', 'mail retry interval minutes', NOW(), NOW(), 0),
    ('MAIL_NOTIFICATION_BATCH_SIZE', '30', 'INTEGER', 'mail dispatch batch size', NOW(), NOW(), 0),
    ('MAIL_NOTIFICATION_TYPE_SCOPE', 'ORDER,REVIEW,POINT,TEAM,SYSTEM', 'STRING', 'mail enabled notification types', NOW(), NOW(), 0),
    ('CONTENT_SENSITIVE_WORDS', '赌博,色情,诈骗', 'STRING', 'sensitive words list', NOW(), NOW(), 0),
    ('CONTENT_SENSITIVE_STRICT_MODE', 'true', 'BOOLEAN', 'strict sensitive words mode', NOW(), NOW(), 0)
ON DUPLICATE KEY UPDATE
    rule_value = VALUES(rule_value),
    rule_type = VALUES(rule_type),
    rule_desc = VALUES(rule_desc),
    update_time = NOW(),
    deleted = 0;
