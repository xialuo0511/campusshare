package com.xialuo.campusshare.entity;

import java.time.LocalDateTime;

/**
 * 组队招募实体
 */
public class TeamRecruitmentEntity extends BaseEntity {
    /** 招募ID */
    private Long recruitmentId;
    /** 关联资源ID */
    private Long resourceId;
    /** 赛事或项目名 */
    private String eventName;
    /** 方向 */
    private String direction;
    /** 技能要求 */
    private String skillRequirement;
    /** 人数上限 */
    private Integer memberLimit;
    /** 截止时间 */
    private LocalDateTime deadline;
}


