package com.xialuo.campusshare.module.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 系统规则更新请求
 */
public class SystemRuleUpdateRequestDto {
    /** 规则值 */
    @NotBlank(message = "规则值不能为空")
    @Size(max = 500, message = "规则值长度不能超过500")
    private String ruleValue;

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
}
