package com.xialuo.campusshare.module.team.dto;

import jakarta.validation.constraints.Size;

/**
 * 组队申请审批请求
 */
public class TeamRecruitmentReviewRequestDto {
    /** 审批备注 */
    @Size(max = 200, message = "审批备注长度不能超过200")
    private String reviewRemark;

    /**
     * 获取审批备注
     */
    public String GetReviewRemark() {
        return reviewRemark;
    }

    /**
     * 设置审批备注
     */
    public void SetReviewRemark(String reviewRemark) {
        this.reviewRemark = reviewRemark;
    }
}

