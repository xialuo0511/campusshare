package com.xialuo.campusshare.module.material.dto;

import jakarta.validation.constraints.Size;

/**
 * 资料下架请求
 */
public class MaterialOfflineRequestDto {
    /** 下架说明 */
    @Size(max = 200, message = "下架说明长度不能超过200")
    private String offlineRemark;

    /**
     * 获取下架说明
     */
    public String GetOfflineRemark() {
        return offlineRemark;
    }

    /**
     * 设置下架说明
     */
    public void SetOfflineRemark(String offlineRemark) {
        this.offlineRemark = offlineRemark;
    }
}
