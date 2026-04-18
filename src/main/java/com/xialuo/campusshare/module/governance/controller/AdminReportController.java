package com.xialuo.campusshare.module.governance.controller;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import com.xialuo.campusshare.common.filter.SessionAuthFilter;
import com.xialuo.campusshare.module.admin.service.AuditLogService;
import com.xialuo.campusshare.module.governance.dto.ReportResponseDto;
import com.xialuo.campusshare.module.governance.dto.ReportReviewRequestDto;
import com.xialuo.campusshare.module.governance.service.ReportService;
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
 * 管理员举报接口
 */
@RestController
@RequestMapping("/api/v1/admin/reports")
public class AdminReportController {
    /** 举报服务 */
    private final ReportService reportService;
    /** 审计日志服务 */
    private final AuditLogService auditLogService;

    public AdminReportController(ReportService reportService, AuditLogService auditLogService) {
        this.reportService = reportService;
        this.auditLogService = auditLogService;
    }

    /**
     * 查询待处理举报
     */
    @GetMapping("/pending")
    public ApiResponse<List<ReportResponseDto>> ListPendingReports(HttpServletRequest httpServletRequest) {
        List<ReportResponseDto> responseDtoList = reportService.ListPendingReports();
        return ApiResponse.Success(responseDtoList, GetRequestId(httpServletRequest));
    }

    /**
     * 审核举报
     */
    @PostMapping("/{reportId}/review")
    public ApiResponse<ReportResponseDto> ReviewReport(
        @PathVariable("reportId") Long reportId,
        @RequestBody @Valid ReportReviewRequestDto requestDto,
        HttpServletRequest httpServletRequest
    ) {
        Long adminUserId = GetCurrentUserId(httpServletRequest);
        ReportResponseDto responseDto = reportService.ReviewReport(reportId, requestDto, adminUserId);
        auditLogService.RecordAuditLog(
            adminUserId,
            "REPORT_REVIEW",
            "REPORT",
            reportId,
            "SUCCESS",
            BuildReportReviewAuditDetail(requestDto)
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
     * 构建举报审核审计明细
     */
    private String BuildReportReviewAuditDetail(ReportReviewRequestDto requestDto) {
        if (requestDto == null) {
            return "";
        }
        StringBuilder detailBuilder = new StringBuilder();
        detailBuilder.append("approved=").append(Boolean.TRUE.equals(requestDto.GetApproved()));
        detailBuilder.append(",dispositionAction=").append(SafeText(requestDto.GetDispositionAction()));
        detailBuilder.append(",reviewRemark=").append(SafeText(requestDto.GetReviewRemark()));
        return detailBuilder.toString();
    }

    /**
     * 安全文本
     */
    private String SafeText(String text) {
        return text == null ? "" : text.trim();
    }
}
