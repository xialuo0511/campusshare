CREATE TABLE IF NOT EXISTS point_account_info (
    account_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '积分账户ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    available_points INT NOT NULL DEFAULT 0 COMMENT '可用积分',
    total_earned_points INT NOT NULL DEFAULT 0 COMMENT '累计获得积分',
    total_consumed_points INT NOT NULL DEFAULT 0 COMMENT '累计消耗积分',
    last_settlement_time DATETIME NULL COMMENT '最近结算时间',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
    UNIQUE KEY uk_point_account_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分账户表';

CREATE TABLE IF NOT EXISTS point_transaction_info (
    transaction_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '积分流水ID',
    account_id BIGINT NOT NULL COMMENT '积分账户ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    transaction_type VARCHAR(30) NOT NULL COMMENT '流水类型',
    change_amount INT NOT NULL COMMENT '变动值',
    balance_after_change INT NOT NULL COMMENT '变动后余额',
    transaction_remark VARCHAR(200) NULL COMMENT '备注',
    source_biz_type VARCHAR(30) NULL COMMENT '来源业务类型',
    source_biz_id BIGINT NULL COMMENT '来源业务ID',
    transaction_time DATETIME NOT NULL COMMENT '交易时间',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
    KEY idx_point_transaction_account_id (account_id),
    KEY idx_point_transaction_user_id (user_id),
    KEY idx_point_transaction_biz (source_biz_type, source_biz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分流水表';

