package com.xialuo.campusshare.module.resource.dto;

/**
 * 商品下架请求
 */
public class ProductOfflineRequestDto {
    /** 下架备注 */
    private String offlineRemark;

    /**
     * 获取下架备注
     */
    public String GetOfflineRemark() {
        return offlineRemark;
    }

    /**
     * 设置下架备注
     */
    public void SetOfflineRemark(String offlineRemark) {
        this.offlineRemark = offlineRemark;
    }
}
