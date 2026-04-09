package com.xialuo.campusshare.module.order.dto;

import jakarta.validation.constraints.Size;

/**
 * 关闭订单请求
 */
public class OrderCloseRequestDto {
    /** 关闭原因 */
    @Size(max = 200, message = "关闭原因长度不能超过200")
    private String closeReason;

    /**
     * 获取关闭原因
     */
    public String GetCloseReason() {
        return closeReason;
    }

    /**
     * 设置关闭原因
     */
    public void SetCloseReason(String closeReason) {
        this.closeReason = closeReason;
    }
}
