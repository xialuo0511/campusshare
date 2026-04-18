package com.xialuo.campusshare.module.admin.controller;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import com.xialuo.campusshare.module.admin.dto.AuditLogListResponseDto;
import com.xialuo.campusshare.module.admin.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 管理员审计日志接口
 */
@RestController
@RequestMapping("/api/v1/admin/audit/logs")
public class AdminAuditLogController {
    /** 审计日志服务 */
    private final AuditLogService auditLogService;

    public AdminAuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    /**
     * 分页查询审计日志
     */
    @GetMapping
    public ApiResponse<AuditLogListResponseDto> ListAuditLogs(
        @RequestParam(value = "pageNo", required = false) Integer pageNo,
        @RequestParam(value = "pageSize", required = false) Integer pageSize,
        @RequestParam(value = "operatorUserId", required = false) Long operatorUserId,
        @RequestParam(value = "actionType", required = false) String actionType,
        @RequestParam(value = "targetType", required = false) String targetType,
        @RequestParam(value = "actionResult", required = false) String actionResult,
        HttpServletRequest httpServletRequest
    ) {
        AuditLogListResponseDto responseDto = auditLogService.ListAuditLogs(
            pageNo,
            pageSize,
            operatorUserId,
            actionType,
            targetType,
            actionResult
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
}

