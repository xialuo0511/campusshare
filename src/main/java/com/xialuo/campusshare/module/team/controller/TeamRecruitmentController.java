package com.xialuo.campusshare.module.team.controller;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import com.xialuo.campusshare.common.filter.SessionAuthFilter;
import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.module.admin.service.AuditLogService;
import com.xialuo.campusshare.module.team.dto.ApplyTeamRecruitmentRequestDto;
import com.xialuo.campusshare.module.team.dto.PublishTeamRecruitmentRequestDto;
import com.xialuo.campusshare.module.team.dto.TeamRecruitmentApplicationResponseDto;
import com.xialuo.campusshare.module.team.dto.TeamRecruitmentListResponseDto;
import com.xialuo.campusshare.module.team.dto.TeamRecruitmentResponseDto;
import com.xialuo.campusshare.module.team.dto.TeamRecruitmentReviewRequestDto;
import com.xialuo.campusshare.module.team.service.TeamRecruitmentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 组队招募接口
 */
@RestController
@RequestMapping("/api/v1/team/recruitments")
public class TeamRecruitmentController {
    /** 招募服务 */
    private final TeamRecruitmentService teamRecruitmentService;
    /** 审计日志服务 */
    private final AuditLogService auditLogService;

    public TeamRecruitmentController(
        TeamRecruitmentService teamRecruitmentService,
        AuditLogService auditLogService
    ) {
        this.teamRecruitmentService = teamRecruitmentService;
        this.auditLogService = auditLogService;
    }

    /**
     * 分页查询招募列表
     */
    @GetMapping
    public ApiResponse<TeamRecruitmentListResponseDto> ListRecruitments(
        @RequestParam(value = "pageNo", required = false) Integer pageNo,
        @RequestParam(value = "pageSize", required = false) Integer pageSize,
        @RequestParam(value = "keyword", required = false) String keyword,
        @RequestParam(value = "direction", required = false) String direction,
        @RequestParam(value = "status", required = false) String status,
        HttpServletRequest httpServletRequest
    ) {
        TeamRecruitmentListResponseDto responseDto = teamRecruitmentService.ListRecruitments(
            pageNo,
            pageSize,
            keyword,
            direction,
            status,
            GetCurrentUserIdOrNull(httpServletRequest)
        );
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 查询招募详情
     */
    @GetMapping("/{recruitmentId}")
    public ApiResponse<TeamRecruitmentResponseDto> GetRecruitmentDetail(
        @PathVariable("recruitmentId") Long recruitmentId,
        HttpServletRequest httpServletRequest
    ) {
        TeamRecruitmentResponseDto responseDto = teamRecruitmentService.GetRecruitmentDetail(
            recruitmentId,
            GetCurrentUserIdOrNull(httpServletRequest)
        );
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 发布组队需求
     */
    @PostMapping
    public ApiResponse<TeamRecruitmentResponseDto> PublishRecruitment(
        @RequestBody @Valid PublishTeamRecruitmentRequestDto requestDto,
        HttpServletRequest httpServletRequest
    ) {
        TeamRecruitmentResponseDto responseDto = teamRecruitmentService.PublishRecruitment(
            requestDto,
            GetCurrentUserId(httpServletRequest)
        );
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 申请加入
     */
    @PostMapping("/{recruitmentId}/apply")
    public ApiResponse<TeamRecruitmentApplicationResponseDto> ApplyRecruitment(
        @PathVariable("recruitmentId") Long recruitmentId,
        @RequestBody(required = false) @Valid ApplyTeamRecruitmentRequestDto requestDto,
        HttpServletRequest httpServletRequest
    ) {
        TeamRecruitmentApplicationResponseDto responseDto = teamRecruitmentService.ApplyRecruitment(
            recruitmentId,
            requestDto,
            GetCurrentUserId(httpServletRequest)
        );
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 查询申请列表
     */
    @GetMapping("/{recruitmentId}/applications")
    public ApiResponse<List<TeamRecruitmentApplicationResponseDto>> ListRecruitmentApplications(
        @PathVariable("recruitmentId") Long recruitmentId,
        HttpServletRequest httpServletRequest
    ) {
        List<TeamRecruitmentApplicationResponseDto> responseDtoList = teamRecruitmentService.ListRecruitmentApplications(
            recruitmentId,
            GetCurrentUserId(httpServletRequest),
            GetCurrentUserRole(httpServletRequest)
        );
        return ApiResponse.Success(responseDtoList, GetRequestId(httpServletRequest));
    }

    /**
     * 审批通过
     */
    @PostMapping("/{recruitmentId}/applications/{applicationId}/approve")
    public ApiResponse<TeamRecruitmentApplicationResponseDto> ApproveApplication(
        @PathVariable("recruitmentId") Long recruitmentId,
        @PathVariable("applicationId") Long applicationId,
        @RequestBody(required = false) @Valid TeamRecruitmentReviewRequestDto requestDto,
        HttpServletRequest httpServletRequest
    ) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        UserRoleEnum currentUserRole = GetCurrentUserRole(httpServletRequest);
        TeamRecruitmentApplicationResponseDto responseDto = teamRecruitmentService.ApproveApplication(
            recruitmentId,
            applicationId,
            requestDto,
            currentUserId,
            currentUserRole
        );
        RecordTeamApplicationAuditIfAdmin(
            currentUserRole,
            currentUserId,
            "TEAM_APPLICATION_APPROVE",
            applicationId,
            recruitmentId,
            requestDto
        );
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 审批拒绝
     */
    @PostMapping("/{recruitmentId}/applications/{applicationId}/reject")
    public ApiResponse<TeamRecruitmentApplicationResponseDto> RejectApplication(
        @PathVariable("recruitmentId") Long recruitmentId,
        @PathVariable("applicationId") Long applicationId,
        @RequestBody(required = false) @Valid TeamRecruitmentReviewRequestDto requestDto,
        HttpServletRequest httpServletRequest
    ) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        UserRoleEnum currentUserRole = GetCurrentUserRole(httpServletRequest);
        TeamRecruitmentApplicationResponseDto responseDto = teamRecruitmentService.RejectApplication(
            recruitmentId,
            applicationId,
            requestDto,
            currentUserId,
            currentUserRole
        );
        RecordTeamApplicationAuditIfAdmin(
            currentUserRole,
            currentUserId,
            "TEAM_APPLICATION_REJECT",
            applicationId,
            recruitmentId,
            requestDto
        );
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 关闭招募
     */
    @PostMapping("/{recruitmentId}/close")
    public ApiResponse<TeamRecruitmentResponseDto> CloseRecruitment(
        @PathVariable("recruitmentId") Long recruitmentId,
        HttpServletRequest httpServletRequest
    ) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        UserRoleEnum currentUserRole = GetCurrentUserRole(httpServletRequest);
        TeamRecruitmentResponseDto responseDto = teamRecruitmentService.CloseRecruitment(
            recruitmentId,
            currentUserId,
            currentUserRole
        );
        if (currentUserRole == UserRoleEnum.ADMINISTRATOR) {
            auditLogService.RecordAuditLog(
                currentUserId,
                "TEAM_RECRUITMENT_CLOSE",
                "TEAM_RECRUITMENT",
                recruitmentId,
                "SUCCESS",
                ""
            );
        }
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 获取请求ID
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
     * 获取当前用户ID(可空)
     */
    private Long GetCurrentUserIdOrNull(HttpServletRequest httpServletRequest) {
        Object currentUserId = httpServletRequest.getAttribute(SessionAuthFilter.CURRENT_USER_ID_ATTRIBUTE);
        if (currentUserId == null) {
            return null;
        }
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
     * 记录管理员审批审计
     */
    private void RecordTeamApplicationAuditIfAdmin(
        UserRoleEnum currentUserRole,
        Long currentUserId,
        String actionType,
        Long applicationId,
        Long recruitmentId,
        TeamRecruitmentReviewRequestDto requestDto
    ) {
        if (currentUserRole != UserRoleEnum.ADMINISTRATOR) {
            return;
        }
        auditLogService.RecordAuditLog(
            currentUserId,
            actionType,
            "TEAM_APPLICATION",
            applicationId,
            "SUCCESS",
            BuildTeamApplicationAuditDetail(recruitmentId, requestDto)
        );
    }

    /**
     * 构建审批审计明细
     */
    private String BuildTeamApplicationAuditDetail(
        Long recruitmentId,
        TeamRecruitmentReviewRequestDto requestDto
    ) {
        StringBuilder detailBuilder = new StringBuilder();
        detailBuilder.append("recruitmentId=").append(recruitmentId == null ? "" : recruitmentId);
        if (requestDto != null && requestDto.GetReviewRemark() != null) {
            detailBuilder.append(",reviewRemark=").append(requestDto.GetReviewRemark().trim());
        }
        return detailBuilder.toString();
    }
}
