package com.xialuo.campusshare.module.governance.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 举报审核请求
 */
public class ReportReviewRequestDto {
    /** 是否成立 */
    @NotNull(message = "审核结论不能为空")
    private Boolean approved;

    /** 处置动作 */
    @Size(max = 50, message = "处置动作长度不能超过50")
    private String dispositionAction;

    /** 审核备注 */
    @Size(max = 500, message = "审核备注长度不能超过500")
    private String reviewRemark;

    /**
     * 获取审核结论
     */
    public Boolean GetApproved() {
        return approved;
    }

    /**
     * 设置审核结论
     */
    public void SetApproved(Boolean approved) {
        this.approved = approved;
    }

    /**
     * 获取处置动作
     */
    public String GetDispositionAction() {
        return dispositionAction;
    }

    /**
     * 设置处置动作
     */
    public void SetDispositionAction(String dispositionAction) {
        this.dispositionAction = dispositionAction;
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
