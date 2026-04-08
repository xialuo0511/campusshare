package com.xialuo.campusshare.module.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 用户资料更新请求
 */
public class UserProfileUpdateRequestDto {
    /** 昵称 */
    @NotBlank(message = "昵称不能为空")
    @Size(min = 1, max = 20, message = "昵称长度需在1到20")
    private String displayName;

    /** 学院 */
    @NotBlank(message = "学院不能为空")
    @Size(max = 50, message = "学院长度不能超过50")
    private String college;

    /** 年级 */
    @NotBlank(message = "年级不能为空")
    @Size(max = 20, message = "年级长度不能超过20")
    private String grade;

    /** 手机号 */
    @Size(max = 30, message = "手机号长度不能超过30")
    private String phone;

    /** 邮箱 */
    @Size(max = 100, message = "邮箱长度不能超过100")
    private String email;

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
}
