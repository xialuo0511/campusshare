package com.xialuo.campusshare.module.user.dto;

import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.enums.UserStatusEnum;
import java.time.LocalDateTime;

/**
 * 用户资料响应
 */
public class UserProfileResponseDto {
    /** 用户ID */
    private Long userId;
    /** 账号 */
    private String account;
    /** 昵称 */
    private String displayName;
    /** 学院 */
    private String college;
    /** 年级 */
    private String grade;
    /** 手机号 */
    private String phone;
    /** 邮箱 */
    private String email;
    /** 角色 */
    private UserRoleEnum userRole;
    /** 状态 */
    private UserStatusEnum userStatus;
    /** 积分余额 */
    private Integer pointBalance;
    /** 最近登录时间 */
    private LocalDateTime lastLoginTime;

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
     * 获取学院
     */
    public String GetCollege() {
        return college;
    }

    /**
     * 设置学院
     */
    public void SetCollege(String college) {
        this.college = college;
    }

    /**
     * 获取年级
     */
    public String GetGrade() {
        return grade;
    }

    /**
     * 设置年级
     */
    public void SetGrade(String grade) {
        this.grade = grade;
    }

    /**
     * 获取手机号
     */
    public String GetPhone() {
        return phone;
    }

    /**
     * 设置手机号
     */
    public void SetPhone(String phone) {
        this.phone = phone;
    }

    /**
     * 获取邮箱
     */
    public String GetEmail() {
        return email;
    }

    /**
     * 设置邮箱
     */
    public void SetEmail(String email) {
        this.email = email;
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
     * 获取积分余额
     */
    public Integer GetPointBalance() {
        return pointBalance;
    }

    /**
     * 设置积分余额
     */
    public void SetPointBalance(Integer pointBalance) {
        this.pointBalance = pointBalance;
    }

    /**
     * 获取最近登录时间
     */
    public LocalDateTime GetLastLoginTime() {
        return lastLoginTime;
    }

    /**
     * 设置最近登录时间
     */
    public void SetLastLoginTime(LocalDateTime lastLoginTime) {
        this.lastLoginTime = lastLoginTime;
    }
}
