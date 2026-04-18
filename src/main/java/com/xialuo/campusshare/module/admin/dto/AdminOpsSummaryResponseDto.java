package com.xialuo.campusshare.module.admin.dto;

import java.time.LocalDateTime;

/**
 * 管理后台运行态总览响应
 */
public class AdminOpsSummaryResponseDto {
    /** 系统总体状态 */
    private String overallStatus;
    /** 数据库状态 */
    private String databaseStatus;
    /** Redis状态 */
    private String redisStatus;
    /** 待派发邮件任务数 */
    private Long pendingMailTaskCount;
    /** 派发失败邮件任务数 */
    private Long failedMailTaskCount;
    /** 待卖家确认超时订单数 */
    private Long timeoutPendingSellerConfirmOrderCount;
    /** 待买家确认超时订单数 */
    private Long timeoutPendingBuyerConfirmOrderCount;
    /** 统计生成时间 */
    private LocalDateTime generateTime;

    /**
     * 获取系统总体状态
     */
    public String GetOverallStatus() {
        return overallStatus;
    }

    /**
     * 设置系统总体状态
     */
    public void SetOverallStatus(String overallStatus) {
        this.overallStatus = overallStatus;
    }

    /**
     * 获取数据库状态
     */
    public String GetDatabaseStatus() {
        return databaseStatus;
    }

    /**
     * 设置数据库状态
     */
    public void SetDatabaseStatus(String databaseStatus) {
        this.databaseStatus = databaseStatus;
    }

    /**
     * 获取Redis状态
     */
    public String GetRedisStatus() {
        return redisStatus;
    }

    /**
     * 设置Redis状态
     */
    public void SetRedisStatus(String redisStatus) {
        this.redisStatus = redisStatus;
    }

    /**
     * 获取待派发邮件任务数
     */
    public Long GetPendingMailTaskCount() {
        return pendingMailTaskCount;
    }

    /**
     * 设置待派发邮件任务数
     */
    public void SetPendingMailTaskCount(Long pendingMailTaskCount) {
        this.pendingMailTaskCount = pendingMailTaskCount;
    }

    /**
     * 获取派发失败邮件任务数
     */
    public Long GetFailedMailTaskCount() {
        return failedMailTaskCount;
    }

    /**
     * 设置派发失败邮件任务数
     */
    public void SetFailedMailTaskCount(Long failedMailTaskCount) {
        this.failedMailTaskCount = failedMailTaskCount;
    }

    /**
     * 获取待卖家确认超时订单数
     */
    public Long GetTimeoutPendingSellerConfirmOrderCount() {
        return timeoutPendingSellerConfirmOrderCount;
    }

    /**
     * 设置待卖家确认超时订单数
     */
    public void SetTimeoutPendingSellerConfirmOrderCount(Long timeoutPendingSellerConfirmOrderCount) {
        this.timeoutPendingSellerConfirmOrderCount = timeoutPendingSellerConfirmOrderCount;
    }

    /**
     * 获取待买家确认超时订单数
     */
    public Long GetTimeoutPendingBuyerConfirmOrderCount() {
        return timeoutPendingBuyerConfirmOrderCount;
    }

    /**
     * 设置待买家确认超时订单数
     */
    public void SetTimeoutPendingBuyerConfirmOrderCount(Long timeoutPendingBuyerConfirmOrderCount) {
        this.timeoutPendingBuyerConfirmOrderCount = timeoutPendingBuyerConfirmOrderCount;
    }

    /**
     * 获取统计生成时间
     */
    public LocalDateTime GetGenerateTime() {
        return generateTime;
    }

    /**
     * 设置统计生成时间
     */
    public void SetGenerateTime(LocalDateTime generateTime) {
        this.generateTime = generateTime;
    }
}
