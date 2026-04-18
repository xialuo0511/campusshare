package com.xialuo.campusshare.module.admin.service;

import com.xialuo.campusshare.module.admin.dto.SystemRuleConfigResponseDto;
import com.xialuo.campusshare.module.admin.dto.SystemRuleUpdateRequestDto;
import java.util.List;

/**
 * 系统规则配置服务
 */
public interface SystemRuleConfigService {
    /**
     * 查询全部规则
     */
    List<SystemRuleConfigResponseDto> ListRules();

    /**
     * 查询规则详情
     */
    SystemRuleConfigResponseDto GetRule(String ruleKey);

    /**
     * 更新规则
     */
    SystemRuleConfigResponseDto UpdateRule(
        String ruleKey,
        SystemRuleUpdateRequestDto requestDto,
        Long adminUserId
    );

    /**
     * 读取规则文本
     */
    String GetRuleValueOrDefault(String ruleKey, String defaultValue);

    /**
     * 读取规则布尔值
     */
    Boolean GetRuleBooleanValueOrDefault(String ruleKey, Boolean defaultValue);

    /**
     * 读取规则整数值
     */
    Integer GetRuleIntegerValueOrDefault(String ruleKey, Integer defaultValue);
}
