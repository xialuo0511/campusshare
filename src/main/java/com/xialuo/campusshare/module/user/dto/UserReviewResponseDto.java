package com.xialuo.campusshare.module.user.dto;

import com.xialuo.campusshare.enums.UserStatusEnum;
import java.time.LocalDateTime;

/**
 * 用户审核响应
 */
public class UserReviewResponseDto {
    /** 用户ID */
    private Long userId;
    /** 审核后状态 */
    private UserStatusEnum userStatus;
    /** 审核管理员ID */
    private Long adminUserId;
    /** 审核意见 */
    private String reviewRemark;
    /** 审核时间 */
    private LocalDateTime reviewTime;

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
     * 获取用户状态
     */
    public UserStatusEnum GetUserStatus() {
        return userStatus;
    }

    /**
     * 设置用户状态
     */
    public void SetUserStatus(UserStatusEnum userStatus) {
        this.userStatus = userStatus;
    }

    /**
     * 获取管理员ID
     */
    public Long GetAdminUserId() {
        return adminUserId;
    }

    /**
     * 设置管理员ID
     */
    public void SetAdminUserId(Long adminUserId) {
        this.adminUserId = adminUserId;
    }

    /**
     * 获取审核意见
     */
    public String GetReviewRemark() {
        return reviewRemark;
    }

    /**
     * 设置审核意见
     */
    public void SetReviewRemark(String reviewRemark) {
        this.reviewRemark = reviewRemark;
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
}
