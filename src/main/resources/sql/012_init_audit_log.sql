CREATE TABLE IF NOT EXISTS audit_log_info (
    audit_log_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '审计日志ID',
    operator_user_id BIGINT NOT NULL COMMENT '操作人ID',
    action_type VARCHAR(64) NOT NULL COMMENT '操作类型',
    target_type VARCHAR(64) NOT NULL COMMENT '目标类型',
    target_id BIGINT NULL COMMENT '目标ID',
    action_result VARCHAR(32) NOT NULL COMMENT '操作结果',
    action_detail VARCHAR(512) NULL COMMENT '操作明细',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '逻辑删除标记',
    INDEX idx_audit_operator_time (operator_user_id, create_time),
    INDEX idx_audit_action_time (action_type, create_time),
    INDEX idx_audit_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审计日志表';

