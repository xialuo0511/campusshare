package com.xialuo.campusshare.module.admin.service.impl;

import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.entity.SystemRuleConfigEntity;
import com.xialuo.campusshare.module.admin.bootstrap.SystemRuleConfigBootstrapInitializer;
import com.xialuo.campusshare.module.admin.dto.SystemRuleConfigResponseDto;
import com.xialuo.campusshare.module.admin.dto.SystemRuleUpdateRequestDto;
import com.xialuo.campusshare.module.admin.mapper.SystemRuleConfigMapper;
import com.xialuo.campusshare.module.admin.service.SystemRuleConfigService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.function.Supplier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 系统规则配置服务实现
 */
@Service
public class SystemRuleConfigServiceImpl implements SystemRuleConfigService {
    /** 日志 */
    private static final Logger LOGGER = LoggerFactory.getLogger(SystemRuleConfigServiceImpl.class);
    /** 规则Mapper */
    private final SystemRuleConfigMapper systemRuleConfigMapper;
    /** 规则表自愈初始化器 */
    private final SystemRuleConfigBootstrapInitializer bootstrapInitializer;

    public SystemRuleConfigServiceImpl(
        SystemRuleConfigMapper systemRuleConfigMapper,
        SystemRuleConfigBootstrapInitializer bootstrapInitializer
    ) {
        this.systemRuleConfigMapper = systemRuleConfigMapper;
        this.bootstrapInitializer = bootstrapInitializer;
    }

    @Override
    public List<SystemRuleConfigResponseDto> ListRules() {
        return ExecuteWithRuleTableReady(systemRuleConfigMapper::ListAllRules).stream()
            .map(this::BuildRuleResponse)
            .toList();
    }

    @Override
    public SystemRuleConfigResponseDto GetRule(String ruleKey) {
        SystemRuleConfigEntity ruleEntity = GetRuleEntity(ruleKey);
        return BuildRuleResponse(ruleEntity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SystemRuleConfigResponseDto UpdateRule(
        String ruleKey,
        SystemRuleUpdateRequestDto requestDto,
        Long adminUserId
    ) {
        SystemRuleConfigEntity ruleEntity = GetRuleEntity(ruleKey);
        Integer updatedRows = systemRuleConfigMapper.UpdateRuleValueByKey(
            ruleEntity.GetRuleKey(),
            requestDto.GetRuleValue().trim(),
            LocalDateTime.now()
        );
        if (updatedRows == null || updatedRows <= 0) {
            throw new BusinessException(BizCodeEnum.SYSTEM_ERROR, "规则更新失败");
        }
        return BuildRuleResponse(GetRuleEntity(ruleEntity.GetRuleKey()));
    }

    @Override
    public String GetRuleValueOrDefault(String ruleKey, String defaultValue) {
        try {
            SystemRuleConfigEntity ruleEntity = ExecuteWithRuleTableReady(
                () -> systemRuleConfigMapper.FindRuleByKey(ruleKey)
            );
            if (ruleEntity == null) {
                return defaultValue;
            }
            String ruleValue = ruleEntity.GetRuleValue();
            if (ruleValue == null || ruleValue.isBlank()) {
                return defaultValue;
            }
            return ruleValue.trim();
        } catch (Exception exception) {
            LOGGER.warn("Read rule failed, fallback default. ruleKey={}", ruleKey, exception);
            return defaultValue;
        }
    }

    @Override
    public Boolean GetRuleBooleanValueOrDefault(String ruleKey, Boolean defaultValue) {
        String ruleValue = GetRuleValueOrDefault(ruleKey, String.valueOf(defaultValue));
        if ("true".equalsIgnoreCase(ruleValue)) {
            return Boolean.TRUE;
        }
        if ("false".equalsIgnoreCase(ruleValue)) {
            return Boolean.FALSE;
        }
        return defaultValue;
    }

    @Override
    public Integer GetRuleIntegerValueOrDefault(String ruleKey, Integer defaultValue) {
        String ruleValue = GetRuleValueOrDefault(ruleKey, String.valueOf(defaultValue));
        try {
            return Integer.parseInt(ruleValue);
        } catch (NumberFormatException exception) {
            return defaultValue;
        }
    }

    /**
     * 获取规则实体
     */
    private SystemRuleConfigEntity GetRuleEntity(String ruleKey) {
        String normalizedRuleKey = NormalizeRuleKey(ruleKey);
        SystemRuleConfigEntity ruleEntity = ExecuteWithRuleTableReady(
            () -> systemRuleConfigMapper.FindRuleByKey(normalizedRuleKey)
        );
        if (ruleEntity == null) {
            throw new BusinessException(BizCodeEnum.RESOURCE_NOT_FOUND, "规则不存在");
        }
        return ruleEntity;
    }

    /**
     * 确保规则表可用后再执行数据库操作
     */
    private <T> T ExecuteWithRuleTableReady(Supplier<T> supplier) {
        try {
            return supplier.get();
        } catch (RuntimeException exception) {
            boolean bootstrapSuccess = bootstrapInitializer.EnsureSystemRuleTable();
            if (!bootstrapSuccess) {
                throw exception;
            }
            return supplier.get();
        }
    }

    /**
     * 构建规则响应
     */
    private SystemRuleConfigResponseDto BuildRuleResponse(SystemRuleConfigEntity ruleEntity) {
        SystemRuleConfigResponseDto responseDto = new SystemRuleConfigResponseDto();
        responseDto.SetRuleKey(ruleEntity.GetRuleKey());
        responseDto.SetRuleValue(ruleEntity.GetRuleValue());
        responseDto.SetRuleType(ruleEntity.GetRuleType());
        responseDto.SetRuleDesc(ruleEntity.GetRuleDesc());
        responseDto.SetUpdateTime(ruleEntity.GetUpdateTime());
        return responseDto;
    }

    /**
     * 规则键标准化
     */
    private String NormalizeRuleKey(String ruleKey) {
        String normalizedRuleKey = ruleKey == null ? "" : ruleKey.trim();
        if (normalizedRuleKey.isBlank()) {
            throw new BusinessException(BizCodeEnum.PARAM_INVALID, "规则键不能为空");
        }
        return normalizedRuleKey;
    }
}
