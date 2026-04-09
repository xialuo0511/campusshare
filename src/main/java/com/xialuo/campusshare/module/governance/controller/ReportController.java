package com.xialuo.campusshare.module.governance.controller;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import com.xialuo.campusshare.common.filter.SessionAuthFilter;
import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.module.governance.dto.ReportResponseDto;
import com.xialuo.campusshare.module.governance.dto.SubmitReportRequestDto;
import com.xialuo.campusshare.module.governance.service.ReportService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 举报接口
 */
@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {
    /** 举报服务 */
    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    /**
     * 提交举报
     */
    @PostMapping
    public ApiResponse<ReportResponseDto> SubmitReport(
        @RequestBody @Valid SubmitReportRequestDto requestDto,
        HttpServletRequest httpServletRequest
    ) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        ReportResponseDto responseDto = reportService.SubmitReport(requestDto, currentUserId);
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 查询举报详情
     */
    @GetMapping("/{reportId}")
    public ApiResponse<ReportResponseDto> GetReportDetail(
        @PathVariable("reportId") Long reportId,
        HttpServletRequest httpServletRequest
    ) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        UserRoleEnum currentUserRole = GetCurrentUserRole(httpServletRequest);
        ReportResponseDto responseDto = reportService.GetReportDetail(
            reportId,
            currentUserId,
            currentUserRole
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
     * 获取当前用户角色
     */
    private UserRoleEnum GetCurrentUserRole(HttpServletRequest httpServletRequest) {
        Object currentUserRole = httpServletRequest.getAttribute(SessionAuthFilter.CURRENT_USER_ROLE_ATTRIBUTE);
        if (currentUserRole instanceof UserRoleEnum userRoleEnum) {
            return userRoleEnum;
        }
        return UserRoleEnum.valueOf(currentUserRole.toString());
    }
}
