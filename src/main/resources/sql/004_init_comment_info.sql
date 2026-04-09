CREATE TABLE IF NOT EXISTS comment_info (
    comment_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '评论ID',
    resource_id BIGINT NOT NULL COMMENT '资源ID',
    from_user_id BIGINT NOT NULL COMMENT '评论人ID',
    to_user_id BIGINT NULL COMMENT '被评论人ID',
    score INT NULL COMMENT '评分',
    content VARCHAR(500) NOT NULL COMMENT '评论内容',
    hidden_flag TINYINT NOT NULL DEFAULT 0 COMMENT '隐藏标记',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
    KEY idx_comment_resource_id (resource_id),
    KEY idx_comment_from_user_id (from_user_id),
    KEY idx_comment_to_user_id (to_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评论表';
