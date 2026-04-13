package com.xialuo.campusshare.module.team.dto;

import com.xialuo.campusshare.enums.TeamRecruitmentApplicationStatusEnum;
import java.time.LocalDateTime;

/**
 * 组队申请响应
 */
public class TeamRecruitmentApplicationResponseDto {
    /** 申请ID */
    private Long applicationId;
    /** 招募ID */
    private Long recruitmentId;
    /** 申请人ID */
    private Long applicantUserId;
    /** 申请人昵称 */
    private String applicantDisplayName;
    /** 申请状态 */
    private TeamRecruitmentApplicationStatusEnum applicationStatus;
    /** 申请备注 */
    private String applyRemark;
    /** 审批备注 */
    private String reviewRemark;
    /** 审批人ID */
    private Long reviewerUserId;
    /** 审批时间 */
    private LocalDateTime reviewTime;
    /** 创建时间 */
    private LocalDateTime createTime;

    /**
     * 获取申请ID
     */
    public Long GetApplicationId() {
        return applicationId;
    }

    /**
     * 设置申请ID
     */
    public void SetApplicationId(Long applicationId) {
        this.applicationId = applicationId;
    }

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
     * 获取申请人ID
     */
    public Long GetApplicantUserId() {
        return applicantUserId;
    }

    /**
     * 设置申请人ID
     */
    public void SetApplicantUserId(Long applicantUserId) {
        this.applicantUserId = applicantUserId;
    }

    /**
     * 获取申请人昵称
     */
    public String GetApplicantDisplayName() {
        return applicantDisplayName;
    }

    /**
     * 设置申请人昵称
     */
    public void SetApplicantDisplayName(String applicantDisplayName) {
        this.applicantDisplayName = applicantDisplayName;
    }

    /**
     * 获取申请状态
     */
    public TeamRecruitmentApplicationStatusEnum GetApplicationStatus() {
        return applicationStatus;
    }

    /**
     * 设置申请状态
     */
    public void SetApplicationStatus(TeamRecruitmentApplicationStatusEnum applicationStatus) {
        this.applicationStatus = applicationStatus;
    }

    /**
     * 获取申请备注
     */
    public String GetApplyRemark() {
        return applyRemark;
    }

    /**
     * 设置申请备注
     */
    public void SetApplyRemark(String applyRemark) {
        this.applyRemark = applyRemark;
    }

    /**
     * 获取审批备注
     */
    public String GetReviewRemark() {
        return reviewRemark;
    }

    /**
     * 设置审批备注
     */
    public void SetReviewRemark(String reviewRemark) {
        this.reviewRemark = reviewRemark;
    }

    /**
     * 获取审批人ID
     */
    public Long GetReviewerUserId() {
        return reviewerUserId;
    }

    /**
     * 设置审批人ID
     */
    public void SetReviewerUserId(Long reviewerUserId) {
        this.reviewerUserId = reviewerUserId;
    }

    /**
     * 获取审批时间
     */
    public LocalDateTime GetReviewTime() {
        return reviewTime;
    }

    /**
     * 设置审批时间
     */
    public void SetReviewTime(LocalDateTime reviewTime) {
        this.reviewTime = reviewTime;
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
}

