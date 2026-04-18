CREATE TABLE IF NOT EXISTS system_rule_config (
    rule_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '规则ID',
    rule_key VARCHAR(100) NOT NULL COMMENT '规则键',
    rule_value VARCHAR(500) NOT NULL COMMENT '规则值',
    rule_type VARCHAR(20) NOT NULL COMMENT '规则类型',
    rule_desc VARCHAR(255) NULL COMMENT '规则说明',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除',
    UNIQUE KEY uk_rule_key (rule_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统规则配置表';

INSERT INTO system_rule_config (
    rule_key, rule_value, rule_type, rule_desc, create_time, update_time, deleted
) VALUES
    ('MATERIAL_REVIEW_REQUIRED', 'true', 'BOOLEAN', '资料上传后是否需要管理员审核', NOW(), NOW(), 0),
    ('MATERIAL_UPLOAD_REWARD_POINTS', '2', 'INTEGER', '资料审核通过后上传奖励积分', NOW(), NOW(), 0),
    ('MATERIAL_DOWNLOAD_COST_POINTS', '1', 'INTEGER', '资料下载扣减积分', NOW(), NOW(), 0),
    ('MATERIAL_FILE_MAX_SIZE_MB', '25', 'INTEGER', '资料上传文件大小上限(MB)', NOW(), NOW(), 0),
    ('MATERIAL_FILE_ALLOWED_EXTENSIONS', 'jpg,jpeg,png,pdf', 'STRING', '资料上传允许扩展名(逗号分隔)', NOW(), NOW(), 0)
ON DUPLICATE KEY UPDATE
    rule_value = VALUES(rule_value),
    rule_type = VALUES(rule_type),
    rule_desc = VALUES(rule_desc),
    update_time = NOW(),
    deleted = 0;
