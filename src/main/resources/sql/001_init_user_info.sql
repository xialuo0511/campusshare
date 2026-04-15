CREATE TABLE IF NOT EXISTS user_info (
    user_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    account VARCHAR(11) NOT NULL COMMENT '学号',
    password_hash VARCHAR(200) NOT NULL COMMENT '密码哈希',
    display_name VARCHAR(20) NOT NULL COMMENT '昵称',
    email VARCHAR(100) NULL COMMENT '邮箱',
    phone VARCHAR(30) NULL COMMENT '手机号',
    college VARCHAR(50) NOT NULL COMMENT '学院',
    grade VARCHAR(20) NOT NULL COMMENT '年级',
    user_role VARCHAR(30) NOT NULL COMMENT '用户角色',
    user_status VARCHAR(30) NOT NULL COMMENT '用户状态',
    point_balance INT NOT NULL DEFAULT 0 COMMENT '积分余额',
    last_login_time DATETIME NULL COMMENT '最近登录时间',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
    UNIQUE KEY uk_user_info_account(account)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
