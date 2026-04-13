package com.xialuo.campusshare.module.team.dto;

import jakarta.validation.constraints.Size;

/**
 * 申请组队请求
 */
public class ApplyTeamRecruitmentRequestDto {
    /** 申请备注 */
    @Size(max = 200, message = "申请备注长度不能超过200")
    private String applyRemark;

    /**
     * 获取申请备注
     */
    public String GetApplyRemark() {
        return applyRemark;
    }

    /**
     * 设置申请备注
     */
    public void SetApplyRemark(String applyRemark) {
        this.applyRemark = applyRemark;
    }
}

