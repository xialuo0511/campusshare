package com.xialuo.campusshare.module.admin.controller;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import com.xialuo.campusshare.module.admin.dto.AdminOpsSummaryResponseDto;
import com.xialuo.campusshare.module.admin.service.AdminOpsService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 管理后台运行态接口
 */
@RestController
@RequestMapping("/api/v1/admin/ops")
public class AdminOpsController {
    /** 运行态服务 */
    private final AdminOpsService adminOpsService;

    public AdminOpsController(AdminOpsService adminOpsService) {
        this.adminOpsService = adminOpsService;
    }

    /**
     * 获取运行态总览
     */
    @GetMapping("/summary")
    public ApiResponse<AdminOpsSummaryResponseDto> GetOpsSummary(HttpServletRequest httpServletRequest) {
        AdminOpsSummaryResponseDto responseDto = adminOpsService.GetOpsSummary();
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
