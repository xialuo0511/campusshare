package com.xialuo.campusshare.entity;

import java.time.LocalDateTime;

public class TeamRecruitmentEntity extends BaseEntity {
    private Long recruitmentId;
    private Long resourceId;
    private String eventName;
    private String direction;
    private String skillRequirement;
    private Integer memberLimit;
    private LocalDateTime deadline;
}
