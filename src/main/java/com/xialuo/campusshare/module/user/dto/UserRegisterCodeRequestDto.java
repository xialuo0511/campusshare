package com.xialuo.campusshare.module.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 注册验证码请求
 */
public class UserRegisterCodeRequestDto {
    /** 学号 */
    @NotBlank(message = "学号不能为空")
    @Pattern(regexp = "^\\d{11}$", message = "学号必须为11位数字")
    private String account;

    /** 邮箱 */
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    @Size(max = 100, message = "邮箱长度不能超过100")
    private String email;

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
