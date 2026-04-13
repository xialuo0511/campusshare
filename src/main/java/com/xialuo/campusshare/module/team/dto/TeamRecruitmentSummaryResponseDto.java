package com.xialuo.campusshare.module.team.dto;

import com.xialuo.campusshare.enums.TeamRecruitmentStatusEnum;
import java.time.LocalDateTime;

/**
 * 组队招募摘要响应
 */
public class TeamRecruitmentSummaryResponseDto {
    /** 招募ID */
    private Long recruitmentId;
    /** 发起人ID */
    private Long publisherUserId;
    /** 发起人昵称 */
    private String publisherDisplayName;
    /** 赛事名称 */
    private String eventName;
    /** 方向 */
    private String direction;
    /** 技能要求 */
    private String skillRequirement;
    /** 人数上限 */
    private Integer memberLimit;
    /** 当前成员数 */
    private Integer currentMemberCount;
    /** 招募状态 */
    private TeamRecruitmentStatusEnum recruitmentStatus;
    /** 截止时间 */
    private LocalDateTime deadline;
    /** 创建时间 */
    private LocalDateTime createTime;
    /** 当前用户是否可申请 */
    private Boolean canApply;
    /** 当前用户是否已申请 */
    private Boolean hasApplied;

    /**
     * 获取招募ID
     */
    public Long GetRecruitmentId() {
        return recruitmentId;
    }

    /**
     * 设置招募ID
     */
    public void SetRecruitmentId(Long recruitmentId) {
        this.recruitmentId = recruitmentId;
    }

    /**
     * 获取发起人ID
     */
    public Long GetPublisherUserId() {
        return publisherUserId;
    }

    /**
     * 设置发起人ID
     */
    public void SetPublisherUserId(Long publisherUserId) {
        this.publisherUserId = publisherUserId;
    }

    /**
     * 获取发起人昵称
     */
    public String GetPublisherDisplayName() {
        return publisherDisplayName;
    }

    /**
     * 设置发起人昵称
     */
    public void SetPublisherDisplayName(String publisherDisplayName) {
        this.publisherDisplayName = publisherDisplayName;
    }

    /**
     * 获取赛事名
     */
    public String GetEventName() {
        return eventName;
    }

    /**
     * 设置赛事名
     */
    public void SetEventName(String eventName) {
        this.eventName = eventName;
    }

    /**
     * 获取方向
     */
    public String GetDirection() {
        return direction;
    }

    /**
     * 设置方向
     */
    public void SetDirection(String direction) {
        this.direction = direction;
    }

    /**
     * 获取技能要求
     */
    public String GetSkillRequirement() {
        return skillRequirement;
    }

    /**
     * 设置技能要求
     */
    public void SetSkillRequirement(String skillRequirement) {
        this.skillRequirement = skillRequirement;
    }

    /**
     * 获取人数上限
     */
    public Integer GetMemberLimit() {
        return memberLimit;
    }

    /**
     * 设置人数上限
     */
    public void SetMemberLimit(Integer memberLimit) {
        this.memberLimit = memberLimit;
    }

    /**
     * 获取当前成员数
     */
    public Integer GetCurrentMemberCount() {
        return currentMemberCount;
    }

    /**
     * 设置当前成员数
     */
    public void SetCurrentMemberCount(Integer currentMemberCount) {
        this.currentMemberCount = currentMemberCount;
    }

    /**
     * 获取招募状态
     */
    public TeamRecruitmentStatusEnum GetRecruitmentStatus() {
        return recruitmentStatus;
    }

    /**
     * 设置招募状态
     */
    public void SetRecruitmentStatus(TeamRecruitmentStatusEnum recruitmentStatus) {
        this.recruitmentStatus = recruitmentStatus;
    }

    /**
     * 获取截止时间
     */
    public LocalDateTime GetDeadline() {
        return deadline;
    }

    /**
     * 设置截止时间
     */
    public void SetDeadline(LocalDateTime deadline) {
        this.deadline = deadline;
    }

    /**
     * 获取创建时间
     */
    public LocalDateTime GetCreateTime() {
        return createTime;
    }

    /**
     * 设置创建时间
     */
    public void SetCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }

    /**
     * 获取可申请标记
     */
    public Boolean GetCanApply() {
        return canApply;
    }

    /**
     * 设置可申请标记
     */
    public void SetCanApply(Boolean canApply) {
        this.canApply = canApply;
    }

    /**
     * 获取已申请标记
     */
    public Boolean GetHasApplied() {
        return hasApplied;
    }

    /**
     * 设置已申请标记
     */
    public void SetHasApplied(Boolean hasApplied) {
        this.hasApplied = hasApplied;
    }
}

