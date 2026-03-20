package com.xialuo.campusshare.module.user.dto;

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

    /** 联系方式 */
    @NotBlank(message = "联系方式不能为空")
    @Size(max = 30, message = "联系方式长度不能超过30")
    private String contact;
}
