package com.xialuo.campusshare.module.user.dto;

import com.xialuo.campusshare.enums.UserStatusEnum;

/**
 * 用户注册响应
 */
public class UserRegisterResponseDto {
    /** 用户ID */
    private Long userId;
    /** 当前状态 */
    private UserStatusEnum userStatus;
    /** 提示信息 */
    private String tip;

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
     * 获取状态
     */
    public UserStatusEnum GetUserStatus() {
        return userStatus;
    }

    /**
     * 设置状态
     */
    public void SetUserStatus(UserStatusEnum userStatus) {
        this.userStatus = userStatus;
    }

    /**
     * 获取提示信息
     */
    public String GetTip() {
        return tip;
    }

    /**
     * 设置提示信息
     */
    public void SetTip(String tip) {
        this.tip = tip;
    }
}
