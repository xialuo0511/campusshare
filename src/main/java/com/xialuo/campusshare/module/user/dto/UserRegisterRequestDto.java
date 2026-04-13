package com.xialuo.campusshare.module.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 用户注册请求
 */
public class UserRegisterRequestDto {
    /** 学号或工号 */
    @NotBlank(message = "学号或工号不能为空")
    @Size(max = 30, message = "学号或工号长度不能超过30")
    private String account;

    /** 登录密码 */
    @NotBlank(message = "登录密码不能为空")
    @Size(min = 8, max = 64, message = "登录密码长度需在8到64")
    private String password;

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

    /** 联系方式(邮箱) */
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    @Size(max = 100, message = "邮箱长度不能超过100")
    private String contact;

    /** 邮箱验证码 */
    @NotBlank(message = "验证码不能为空")
    @Size(min = 6, max = 6, message = "验证码长度必须为6位")
    private String verificationCode;

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
     * 获取密码
     */
    public String GetPassword() {
        return password;
    }

    /**
     * 设置密码
     */
    public void SetPassword(String password) {
        this.password = password;
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
     * 获取联系方式
     */
    public String GetContact() {
        return contact;
    }

    /**
     * 设置联系方式
     */
    public void SetContact(String contact) {
        this.contact = contact;
    }

    /**
     * 获取验证码
     */
    public String GetVerificationCode() {
        return verificationCode;
    }

    /**
     * 设置验证码
     */
    public void SetVerificationCode(String verificationCode) {
        this.verificationCode = verificationCode;
    }
}

