CREATE TABLE IF NOT EXISTS team_recruitment_info (
    recruitment_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '招募ID',
    resource_id BIGINT NULL COMMENT '资源ID',
    publisher_user_id BIGINT NOT NULL COMMENT '发起人ID',
    event_name VARCHAR(100) NOT NULL COMMENT '赛事或项目名称',
    direction VARCHAR(50) NOT NULL COMMENT '方向',
    skill_requirement VARCHAR(500) NULL COMMENT '技能要求',
    member_limit INT NOT NULL COMMENT '人数上限',
    current_member_count INT NOT NULL DEFAULT 1 COMMENT '当前成员数',
    recruitment_status VARCHAR(30) NOT NULL COMMENT '招募状态',
    deadline DATETIME NOT NULL COMMENT '截止时间',
    close_time DATETIME NULL COMMENT '关闭时间',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
    KEY idx_team_recruitment_publisher_user_id (publisher_user_id),
    KEY idx_team_recruitment_direction (direction),
    KEY idx_team_recruitment_status (recruitment_status),
    KEY idx_team_recruitment_deadline (deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='组队招募表';

CREATE TABLE IF NOT EXISTS team_recruitment_application_info (
    application_id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '申请ID',
    recruitment_id BIGINT NOT NULL COMMENT '招募ID',
    applicant_user_id BIGINT NOT NULL COMMENT '申请人ID',
    application_status VARCHAR(30) NOT NULL COMMENT '申请状态',
    apply_remark VARCHAR(200) NULL COMMENT '申请备注',
    review_remark VARCHAR(200) NULL COMMENT '审批备注',
    reviewer_user_id BIGINT NULL COMMENT '审批人ID',
    review_time DATETIME NULL COMMENT '审批时间',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
    UNIQUE KEY uk_team_recruitment_id_applicant_user_id (recruitment_id, applicant_user_id),
    KEY idx_team_application_status (application_status),
    KEY idx_team_application_recruitment_id (recruitment_id),
    KEY idx_team_application_applicant_user_id (applicant_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='组队申请表';

