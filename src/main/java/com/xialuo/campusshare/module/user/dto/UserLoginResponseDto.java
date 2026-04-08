package com.xialuo.campusshare.module.user.dto;

import com.xialuo.campusshare.enums.UserRoleEnum;

/**
 * 用户登录响应
 */
public class UserLoginResponseDto {
    /** 用户ID */
    private Long userId;
    /** 账号 */
    private String account;
    /** 昵称 */
    private String displayName;
    /** 角色 */
    private UserRoleEnum userRole;
    /** 登录令牌 */
    private String token;

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
     * 获取账号
     */
    public String GetAccount() {
        return account;
    }

    /**
     * 设置账号
     */
    public void SetAccount(String account) {
        this.account = account;
    }

    /**
     * 获取昵称
     */
    public String GetDisplayName() {
        return displayName;
    }

    /**
     * 设置昵称
     */
    public void SetDisplayName(String displayName) {
        this.displayName = displayName;
    }

    /**
     * 获取角色
     */
    public UserRoleEnum GetUserRole() {
        return userRole;
    }

    /**
     * 设置角色
     */
    public void SetUserRole(UserRoleEnum userRole) {
        this.userRole = userRole;
    }

    /**
     * 获取令牌
     */
    public String GetToken() {
        return token;
    }

    /**
     * 设置令牌
     */
    public void SetToken(String token) {
        this.token = token;
    }
}
