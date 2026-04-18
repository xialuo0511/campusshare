package com.xialuo.campusshare.entity;

/**
 * 系统规则配置实体
 */
public class SystemRuleConfigEntity extends BaseEntity {
    /** 规则ID */
    private Long ruleId;
    /** 规则键 */
    private String ruleKey;
    /** 规则值 */
    private String ruleValue;
    /** 规则类型 */
    private String ruleType;
    /** 规则说明 */
    private String ruleDesc;

    /**
     * 获取规则ID
     */
    public Long GetRuleId() {
        return ruleId;
    }

    /**
     * 设置规则ID
     */
    public void SetRuleId(Long ruleId) {
        this.ruleId = ruleId;
    }

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
}
