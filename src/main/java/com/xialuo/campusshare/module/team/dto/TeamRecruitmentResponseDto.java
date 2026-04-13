package com.xialuo.campusshare.module.team.dto;

import java.time.LocalDateTime;

/**
 * 组队招募详情响应
 */
public class TeamRecruitmentResponseDto extends TeamRecruitmentSummaryResponseDto {
    /** 关闭时间 */
    private LocalDateTime closeTime;
    /** 申请总数 */
    private Long applicationCount;

    /**
     * 获取关闭时间
     */
    public LocalDateTime GetCloseTime() {
        return closeTime;
    }

    /**
     * 设置关闭时间
     */
    public void SetCloseTime(LocalDateTime closeTime) {
        this.closeTime = closeTime;
    }

    /**
     * 获取申请总数
     */
    public Long GetApplicationCount() {
        return applicationCount;
    }

    /**
     * 设置申请总数
     */
    public void SetApplicationCount(Long applicationCount) {
        this.applicationCount = applicationCount;
    }
}

