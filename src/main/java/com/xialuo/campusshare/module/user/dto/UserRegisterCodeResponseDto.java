package com.xialuo.campusshare.module.user.dto;

/**
 * 注册验证码响应
 */
public class UserRegisterCodeResponseDto {
    /** 提示信息 */
    private String tip;

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

