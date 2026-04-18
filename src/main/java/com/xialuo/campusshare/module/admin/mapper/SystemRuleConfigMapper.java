package com.xialuo.campusshare.module.admin.mapper;

import com.xialuo.campusshare.entity.SystemRuleConfigEntity;
import java.time.LocalDateTime;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 系统规则配置映射
 */
@Mapper
public interface SystemRuleConfigMapper {
    /**
     * 查询全部规则
     */
    List<SystemRuleConfigEntity> ListAllRules();

    /**
     * 按键查询规则
     */
    SystemRuleConfigEntity FindRuleByKey(@Param("ruleKey") String ruleKey);

    /**
     * 更新规则值
     */
    Integer UpdateRuleValueByKey(
        @Param("ruleKey") String ruleKey,
        @Param("ruleValue") String ruleValue,
        @Param("updateTime") LocalDateTime updateTime
    );
}
