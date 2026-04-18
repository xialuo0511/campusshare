package com.xialuo.campusshare.module.admin.controller;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import com.xialuo.campusshare.module.admin.dto.AdminDashboardSummaryResponseDto;
import com.xialuo.campusshare.module.admin.service.AdminDashboardService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 管理后台看板接口
 */
@RestController
@RequestMapping("/api/v1/admin/dashboard")
public class AdminDashboardController {
    /** 管理看板服务 */
    private final AdminDashboardService adminDashboardService;

    public AdminDashboardController(AdminDashboardService adminDashboardService) {
        this.adminDashboardService = adminDashboardService;
    }

    /**
     * 获取后台总览统计
     */
    @GetMapping("/summary")
    public ApiResponse<AdminDashboardSummaryResponseDto> GetDashboardSummary(HttpServletRequest httpServletRequest) {
        AdminDashboardSummaryResponseDto responseDto = adminDashboardService.GetDashboardSummary();
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
