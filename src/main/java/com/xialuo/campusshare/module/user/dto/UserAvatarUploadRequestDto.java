package com.xialuo.campusshare.module.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 用户头像上传请求
 */
public class UserAvatarUploadRequestDto {
    /** 头像DataURL */
    @NotBlank(message = "头像不能为空")
    @Size(max = 600000, message = "头像文件过大")
    private String avatarDataUrl;

    /**
     * 获取头像DataURL
     */
    public String GetAvatarDataUrl() {
        return avatarDataUrl;
    }

    /**
     * 设置头像DataURL
     */
    public void SetAvatarDataUrl(String avatarDataUrl) {
        this.avatarDataUrl = avatarDataUrl;
    }
}
