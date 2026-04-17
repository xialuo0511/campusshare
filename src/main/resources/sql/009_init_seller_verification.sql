CREATE TABLE IF NOT EXISTS seller_verification_application_info (
    application_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '申请ID',
    user_id BIGINT NOT NULL COMMENT '申请用户ID',
    real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    contact_phone VARCHAR(30) NULL COMMENT '联系电话',
    qualification_desc VARCHAR(500) NOT NULL COMMENT '资质说明',
    credential_file_ids VARCHAR(1000) NULL COMMENT '资质文件ID集合',
    application_status VARCHAR(30) NOT NULL COMMENT '申请状态',
    review_remark VARCHAR(200) NULL COMMENT '审核备注',
    reviewer_user_id BIGINT NULL COMMENT '审核人ID',
    review_time DATETIME NULL COMMENT '审核时间',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
    KEY idx_seller_verification_user_id(user_id),
    KEY idx_seller_verification_status(application_status),
    KEY idx_seller_verification_create_time(create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='卖家认证申请表';

