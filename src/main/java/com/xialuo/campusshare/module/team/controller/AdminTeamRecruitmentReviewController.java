package com.xialuo.campusshare.module.team.controller;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import com.xialuo.campusshare.common.filter.SessionAuthFilter;
import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.module.admin.service.AuditLogService;
import com.xialuo.campusshare.module.team.dto.TeamRecruitmentContentReviewRequestDto;
import com.xialuo.campusshare.module.team.dto.TeamRecruitmentListResponseDto;
import com.xialuo.campusshare.module.team.dto.TeamRecruitmentResponseDto;
import com.xialuo.campusshare.module.team.service.TeamRecruitmentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 管理员组队招募审核接口
 */
@RestController
@RequestMapping("/api/v1/admin/team/recruitments")
public class AdminTeamRecruitmentReviewController {
    /** 组队服务 */
    private final TeamRecruitmentService teamRecruitmentService;
    /** 审计日志服务 */
    private final AuditLogService auditLogService;

    public AdminTeamRecruitmentReviewController(
        TeamRecruitmentService teamRecruitmentService,
        AuditLogService auditLogService
    ) {
        this.teamRecruitmentService = teamRecruitmentService;
        this.auditLogService = auditLogService;
    }

    /**
     * 查询待审核招募
     */
    @GetMapping("/pending")
    public ApiResponse<TeamRecruitmentListResponseDto> ListPendingRecruitments(
        @RequestParam(value = "pageNo", required = false) Integer pageNo,
        @RequestParam(value = "pageSize", required = false) Integer pageSize,
        HttpServletRequest httpServletRequest
    ) {
        TeamRecruitmentListResponseDto responseDto = teamRecruitmentService.ListPendingReviewRecruitments(
            pageNo,
            pageSize,
            GetCurrentUserId(httpServletRequest),
            GetCurrentUserRole(httpServletRequest)
        );
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 审核招募
     */
    @PostMapping("/{recruitmentId}/review")
    public ApiResponse<TeamRecruitmentResponseDto> ReviewRecruitment(
        @PathVariable("recruitmentId") Long recruitmentId,
        @RequestBody @Valid TeamRecruitmentContentReviewRequestDto requestDto,
        HttpServletRequest httpServletRequest
    ) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        TeamRecruitmentResponseDto responseDto = teamRecruitmentService.ReviewRecruitment(
            recruitmentId,
            requestDto,
            currentUserId,
            GetCurrentUserRole(httpServletRequest)
        );
        auditLogService.RecordAuditLog(
            currentUserId,
            "TEAM_RECRUITMENT_REVIEW",
            "TEAM_RECRUITMENT",
            recruitmentId,
            "SUCCESS",
            BuildAuditDetail(requestDto)
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

    /**
     * 构建审计明细
     */
    private String BuildAuditDetail(TeamRecruitmentContentReviewRequestDto requestDto) {
        if (requestDto == null) {
            return "";
        }
        StringBuilder detailBuilder = new StringBuilder();
        detailBuilder.append("approved=").append(Boolean.TRUE.equals(requestDto.GetApproved()));
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
