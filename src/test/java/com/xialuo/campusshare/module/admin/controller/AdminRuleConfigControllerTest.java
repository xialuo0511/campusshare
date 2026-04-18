package com.xialuo.campusshare.module.admin.controller;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import com.xialuo.campusshare.common.filter.SessionAuthFilter;
import com.xialuo.campusshare.module.admin.dto.SystemRuleConfigResponseDto;
import com.xialuo.campusshare.module.admin.dto.SystemRuleUpdateRequestDto;
import com.xialuo.campusshare.module.admin.service.AuditLogService;
import com.xialuo.campusshare.module.admin.service.SystemRuleConfigService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 管理员规则配置接口测试
 */
class AdminRuleConfigControllerTest {

    /**
     * 查询规则列表应返回成功
     */
    @Test
    void ListRulesShouldReturnSuccess() {
        SystemRuleConfigService systemRuleConfigService = mock(SystemRuleConfigService.class);
        AuditLogService auditLogService = mock(AuditLogService.class);
        AdminRuleConfigController controller = new AdminRuleConfigController(systemRuleConfigService, auditLogService);
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getAttribute(RequestIdFilter.REQUEST_ID_ATTRIBUTE)).thenReturn("req-test-1");

        SystemRuleConfigResponseDto responseDto = new SystemRuleConfigResponseDto();
        responseDto.SetRuleKey("MATERIAL_REVIEW_REQUIRED");
        responseDto.SetRuleValue("true");
        when(systemRuleConfigService.ListRules()).thenReturn(List.of(responseDto));

        ApiResponse<List<SystemRuleConfigResponseDto>> response = controller.ListRules(request);

        Assertions.assertEquals(0, response.GetCode());
        Assertions.assertEquals(1, response.GetData().size());
        Assertions.assertEquals("MATERIAL_REVIEW_REQUIRED", response.GetData().get(0).GetRuleKey());
    }

    /**
     * 更新规则应记录审计日志
     */
    @Test
    void UpdateRuleShouldRecordAuditLog() {
        SystemRuleConfigService systemRuleConfigService = mock(SystemRuleConfigService.class);
        AuditLogService auditLogService = mock(AuditLogService.class);
        AdminRuleConfigController controller = new AdminRuleConfigController(systemRuleConfigService, auditLogService);
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getAttribute(RequestIdFilter.REQUEST_ID_ATTRIBUTE)).thenReturn("req-test-2");
        when(request.getAttribute(SessionAuthFilter.CURRENT_USER_ID_ATTRIBUTE)).thenReturn(1L);

        SystemRuleUpdateRequestDto requestDto = new SystemRuleUpdateRequestDto();
        requestDto.SetRuleValue("3");

        SystemRuleConfigResponseDto responseDto = new SystemRuleConfigResponseDto();
        responseDto.SetRuleKey("MATERIAL_UPLOAD_REWARD_POINTS");
        responseDto.SetRuleValue("3");
        when(systemRuleConfigService.UpdateRule(eq("MATERIAL_UPLOAD_REWARD_POINTS"), eq(requestDto), eq(1L)))
            .thenReturn(responseDto);

        ApiResponse<SystemRuleConfigResponseDto> response = controller.UpdateRule(
            "MATERIAL_UPLOAD_REWARD_POINTS",
            requestDto,
            request
        );

        Assertions.assertEquals(0, response.GetCode());
        Assertions.assertEquals("3", response.GetData().GetRuleValue());
        verify(auditLogService, times(1)).RecordAuditLog(
            eq(1L),
            eq("RULE_UPDATE"),
            eq("SYSTEM_RULE"),
            isNull(),
            eq("SUCCESS"),
            anyString()
        );
    }
}

