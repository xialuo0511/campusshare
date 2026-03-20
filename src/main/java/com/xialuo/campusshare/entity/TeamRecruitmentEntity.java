package com.xialuo.campusshare.entity;

import java.time.LocalDateTime;

/**
 * 组队招募实体
 */
public class TeamRecruitmentEntity extends BaseEntity {
    private Long recruitmentId; // 招募ID
    private Long resourceId; // 关联资源ID
    private String eventName; // 赛事或项目名
    private String direction; // 方向
    private String skillRequirement; // 技能要求
    private Integer memberLimit; // 人数上限
    private LocalDateTime deadline; // 截止时间
}
