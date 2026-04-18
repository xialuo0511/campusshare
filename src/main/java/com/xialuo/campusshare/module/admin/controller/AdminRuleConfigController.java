package com.xialuo.campusshare.module.admin.controller;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import com.xialuo.campusshare.common.filter.SessionAuthFilter;
import com.xialuo.campusshare.module.admin.dto.SystemRuleConfigResponseDto;
import com.xialuo.campusshare.module.admin.dto.SystemRuleUpdateRequestDto;
import com.xialuo.campusshare.module.admin.service.AuditLogService;
import com.xialuo.campusshare.module.admin.service.SystemRuleConfigService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 管理员规则配置接口
 */
@RestController
@RequestMapping("/api/v1/admin/rules")
public class AdminRuleConfigController {
    /** 规则配置服务 */
    private final SystemRuleConfigService systemRuleConfigService;
    /** 审计日志服务 */
    private final AuditLogService auditLogService;

    public AdminRuleConfigController(
        SystemRuleConfigService systemRuleConfigService,
        AuditLogService auditLogService
    ) {
        this.systemRuleConfigService = systemRuleConfigService;
        this.auditLogService = auditLogService;
    }

    /**
     * 查询全部规则
     */
    @GetMapping
    public ApiResponse<List<SystemRuleConfigResponseDto>> ListRules(HttpServletRequest httpServletRequest) {
        List<SystemRuleConfigResponseDto> responseDtoList = systemRuleConfigService.ListRules();
        return ApiResponse.Success(responseDtoList, GetRequestId(httpServletRequest));
    }

    /**
     * 查询规则详情
     */
    @GetMapping("/{ruleKey}")
    public ApiResponse<SystemRuleConfigResponseDto> GetRule(
        @PathVariable("ruleKey") String ruleKey,
        HttpServletRequest httpServletRequest
    ) {
        SystemRuleConfigResponseDto responseDto = systemRuleConfigService.GetRule(ruleKey);
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 更新规则
     */
    @PostMapping("/{ruleKey}")
    public ApiResponse<SystemRuleConfigResponseDto> UpdateRule(
        @PathVariable("ruleKey") String ruleKey,
        @RequestBody @Valid SystemRuleUpdateRequestDto requestDto,
        HttpServletRequest httpServletRequest
    ) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        SystemRuleConfigResponseDto responseDto = systemRuleConfigService.UpdateRule(
            ruleKey,
            requestDto,
            currentUserId
        );
        auditLogService.RecordAuditLog(
            currentUserId,
            "RULE_UPDATE",
            "SYSTEM_RULE",
            null,
            "SUCCESS",
            BuildRuleAuditDetail(responseDto)
        );
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 获取请求追踪ID
     */
    private String GetRequestId(HttpServletRequest httpServletRequest) {
        Object requestId = httpServletRequest.getAttribute(RequestIdFilter.REQUEST_ID_ATTRIBUTE);
        return requestId == null ? "" : requestId.toString();
    }

    /**
     * 获取当前用户ID
     */
    private Long GetCurrentUserId(HttpServletRequest httpServletRequest) {
        Object currentUserId = httpServletRequest.getAttribute(SessionAuthFilter.CURRENT_USER_ID_ATTRIBUTE);
        if (currentUserId instanceof Long currentUserIdLong) {
            return currentUserIdLong;
        }
        return Long.parseLong(currentUserId.toString());
    }

    /**
     * 构建规则变更审计明细
     */
    private String BuildRuleAuditDetail(SystemRuleConfigResponseDto responseDto) {
        if (responseDto == null) {
            return "";
        }
        StringBuilder detailBuilder = new StringBuilder();
        detailBuilder.append("ruleKey=").append(responseDto.GetRuleKey());
        detailBuilder.append(",ruleValue=").append(responseDto.GetRuleValue());
        return detailBuilder.toString();
    }
}

