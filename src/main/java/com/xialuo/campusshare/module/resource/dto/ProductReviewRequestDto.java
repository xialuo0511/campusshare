package com.xialuo.campusshare.module.resource.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 商品审核请求
 */
public class ProductReviewRequestDto {
    /** 是否通过 */
    @NotNull(message = "审核结果不能为空")
    private Boolean approved;
    /** 审核备注 */
    @Size(max = 200, message = "审核备注长度不能超过200")
    private String reviewRemark;

    /**
     * 获取审核结果
     */
    public Boolean GetApproved() {
        return approved;
    }

    /**
     * 设置审核结果
     */
    public void SetApproved(Boolean approved) {
        this.approved = approved;
    }

    /**
     * 获取审核备注
     */
    public String GetReviewRemark() {
        return reviewRemark;
    }

    /**
     * 设置审核备注
     */
    public void SetReviewRemark(String reviewRemark) {
        this.reviewRemark = reviewRemark;
    }
}
