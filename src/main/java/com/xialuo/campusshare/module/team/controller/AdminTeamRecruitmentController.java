package com.xialuo.campusshare.module.team.controller;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import com.xialuo.campusshare.common.filter.SessionAuthFilter;
import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.module.team.dto.TeamRecruitmentApplicationResponseDto;
import com.xialuo.campusshare.module.team.service.TeamRecruitmentService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 管理员组队接口
 */
@RestController
@RequestMapping("/api/v1/admin/team/applications")
public class AdminTeamRecruitmentController {
    /** 组队服务 */
    private final TeamRecruitmentService teamRecruitmentService;

    public AdminTeamRecruitmentController(TeamRecruitmentService teamRecruitmentService) {
        this.teamRecruitmentService = teamRecruitmentService;
    }

    /**
     * 查询全局待审批申请
     */
    @GetMapping("/pending")
    public ApiResponse<List<TeamRecruitmentApplicationResponseDto>> ListPendingApplications(
        HttpServletRequest httpServletRequest
    ) {
        List<TeamRecruitmentApplicationResponseDto> responseDtoList = teamRecruitmentService.ListPendingApplications(
            GetCurrentUserId(httpServletRequest),
            GetCurrentUserRole(httpServletRequest)
        );
        return ApiResponse.Success(responseDtoList, GetRequestId(httpServletRequest));
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
