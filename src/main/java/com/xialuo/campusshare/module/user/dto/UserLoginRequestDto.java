package com.xialuo.campusshare.module.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 用户登录请求
 */
public class UserLoginRequestDto {
    /** 账号 */
    @NotBlank(message = "账号不能为空")
    @Size(max = 30, message = "账号长度不能超过30")
    private String account;

    /** 密码 */
    @NotBlank(message = "密码不能为空")
    @Size(min = 8, max = 64, message = "密码长度需在8到64")
    private String password;

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
}
