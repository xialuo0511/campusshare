package com.xialuo.campusshare.module.statistics.dto;

import java.time.LocalDateTime;

/**
 * 系统健康响应
 */
public class SystemHealthResponseDto {
    /** 应用名 */
    private String appName;
    /** 环境 */
    private String environment;
    /** 总体状态 */
    private String overallStatus;
    /** 数据库状态 */
    private String databaseStatus;
    /** Redis状态 */
    private String redisStatus;
    /** 检查时间 */
    private LocalDateTime checkTime;

    /**
     * 获取应用名
     */
    public String GetAppName() {
        return appName;
    }

    /**
     * 设置应用名
     */
    public void SetAppName(String appName) {
        this.appName = appName;
    }

    /**
     * 获取环境
     */
    public String GetEnvironment() {
        return environment;
    }

    /**
     * 设置环境
     */
    public void SetEnvironment(String environment) {
        this.environment = environment;
    }

    /**
     * 获取总体状态
     */
    public String GetOverallStatus() {
        return overallStatus;
    }

    /**
     * 设置总体状态
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
     * 获取检查时间
     */
    public LocalDateTime GetCheckTime() {
        return checkTime;
    }

    /**
     * 设置检查时间
     */
    public void SetCheckTime(LocalDateTime checkTime) {
        this.checkTime = checkTime;
    }
}

