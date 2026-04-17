package com.xialuo.campusshare.module.user.dto;

import com.xialuo.campusshare.enums.SellerVerificationStatusEnum;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 卖家认证申请响应
 */
public class SellerVerificationApplicationResponseDto {
    /** 申请ID */
    private Long applicationId;
    /** 用户ID */
    private Long userId;
    /** 真实姓名 */
    private String realName;
    /** 联系电话 */
    private String contactPhone;
    /** 资质说明 */
    private String qualificationDesc;
    /** 资质文件ID列表 */
    private List<String> credentialFileIds;
    /** 申请状态 */
    private SellerVerificationStatusEnum applicationStatus;
    /** 审核备注 */
    private String reviewRemark;
    /** 审核人ID */
    private Long reviewerUserId;
    /** 审核时间 */
    private LocalDateTime reviewTime;
    /** 创建时间 */
    private LocalDateTime createTime;
    /** 更新时间 */
    private LocalDateTime updateTime;

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
     * 获取用户ID
     */
    public Long GetUserId() {
        return userId;
    }

    /**
     * 设置用户ID
     */
    public void SetUserId(Long userId) {
        this.userId = userId;
    }

    /**
     * 获取真实姓名
     */
    public String GetRealName() {
        return realName;
    }

    /**
     * 设置真实姓名
     */
    public void SetRealName(String realName) {
        this.realName = realName;
    }

    /**
     * 获取联系电话
     */
    public String GetContactPhone() {
        return contactPhone;
    }

    /**
     * 设置联系电话
     */
    public void SetContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    /**
     * 获取资质说明
     */
    public String GetQualificationDesc() {
        return qualificationDesc;
    }

    /**
     * 设置资质说明
     */
    public void SetQualificationDesc(String qualificationDesc) {
        this.qualificationDesc = qualificationDesc;
    }

    /**
     * 获取资质文件ID列表
     */
    public List<String> GetCredentialFileIds() {
        return credentialFileIds;
    }

    /**
     * 设置资质文件ID列表
     */
    public void SetCredentialFileIds(List<String> credentialFileIds) {
        this.credentialFileIds = credentialFileIds;
    }

    /**
     * 获取申请状态
     */
    public SellerVerificationStatusEnum GetApplicationStatus() {
        return applicationStatus;
    }

    /**
     * 设置申请状态
     */
    public void SetApplicationStatus(SellerVerificationStatusEnum applicationStatus) {
        this.applicationStatus = applicationStatus;
    }

    /**
     * 获取审核备注
     */
    public String GetReviewRemark() {
        return reviewRemark;
    }

    /**
     * 设置审核备注
     */
    public void SetReviewRemark(String reviewRemark) {
        this.reviewRemark = reviewRemark;
    }

    /**
     * 获取审核人ID
     */
    public Long GetReviewerUserId() {
        return reviewerUserId;
    }

    /**
     * 设置审核人ID
     */
    public void SetReviewerUserId(Long reviewerUserId) {
        this.reviewerUserId = reviewerUserId;
    }

    /**
     * 获取审核时间
     */
    public LocalDateTime GetReviewTime() {
        return reviewTime;
    }

    /**
     * 设置审核时间
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

    /**
     * 获取更新时间
     */
    public LocalDateTime GetUpdateTime() {
        return updateTime;
    }

    /**
     * 设置更新时间
     */
    public void SetUpdateTime(LocalDateTime updateTime) {
        this.updateTime = updateTime;
    }
}

