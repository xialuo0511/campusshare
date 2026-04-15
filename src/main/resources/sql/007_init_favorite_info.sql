CREATE TABLE IF NOT EXISTS favorite_info (
    favorite_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '收藏ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    resource_id BIGINT NOT NULL COMMENT '资源ID(商品ID)',
    canceled TINYINT NOT NULL DEFAULT 0 COMMENT '是否取消',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
    UNIQUE KEY uk_favorite_user_resource (user_id, resource_id),
    KEY idx_favorite_resource_id (resource_id),
    KEY idx_favorite_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收藏表';
