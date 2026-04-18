package com.xialuo.campusshare.module.admin.dto;

import java.time.LocalDateTime;

/**
 * 系统规则响应
 */
public class SystemRuleConfigResponseDto {
    /** 规则键 */
    private String ruleKey;
    /** 规则值 */
    private String ruleValue;
    /** 规则类型 */
    private String ruleType;
    /** 规则说明 */
    private String ruleDesc;
    /** 更新时间 */
    private LocalDateTime updateTime;

    /**
     * 获取规则键
     */
    public String GetRuleKey() {
        return ruleKey;
    }

    /**
     * 设置规则键
     */
    public void SetRuleKey(String ruleKey) {
        this.ruleKey = ruleKey;
    }

    /**
     * 获取规则值
     */
    public String GetRuleValue() {
        return ruleValue;
    }

    /**
     * 设置规则值
     */
    public void SetRuleValue(String ruleValue) {
        this.ruleValue = ruleValue;
    }

    /**
     * 获取规则类型
     */
    public String GetRuleType() {
        return ruleType;
    }

    /**
     * 设置规则类型
     */
    public void SetRuleType(String ruleType) {
        this.ruleType = ruleType;
    }

    /**
     * 获取规则说明
     */
    public String GetRuleDesc() {
        return ruleDesc;
    }

    /**
     * 设置规则说明
     */
    public void SetRuleDesc(String ruleDesc) {
        this.ruleDesc = ruleDesc;
    }

    /**
     * 获取更新时间
     */
    public LocalDateTime GetUpdateTime() {
        return updateTime;
    }

    /**
     * 设置更新时间
     */
    public void SetUpdateTime(LocalDateTime updateTime) {
        this.updateTime = updateTime;
    }
}
