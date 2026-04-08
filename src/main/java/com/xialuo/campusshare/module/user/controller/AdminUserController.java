package com.xialuo.campusshare.module.user.controller;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import com.xialuo.campusshare.module.user.dto.UserProfileResponseDto;
import com.xialuo.campusshare.module.user.dto.UserReviewRequestDto;
import com.xialuo.campusshare.module.user.dto.UserReviewResponseDto;
import com.xialuo.campusshare.module.user.service.UserService;
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
 * 管理员用户接口
 */
@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {
    /** 用户服务 */
    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * 查询待审核用户
     */
    @GetMapping("/pending")
    public ApiResponse<List<UserProfileResponseDto>> ListPendingUsers(HttpServletRequest httpServletRequest) {
        List<UserProfileResponseDto> responseDtoList = userService.ListPendingReviewUsers();
        return ApiResponse.Success(responseDtoList, GetRequestId(httpServletRequest));
    }

    /**
     * 审核用户
     */
    @PostMapping("/{userId}/review")
    public ApiResponse<UserReviewResponseDto> ReviewUser(
        @PathVariable("userId") Long userId,
        @RequestBody @Valid UserReviewRequestDto requestDto,
        HttpServletRequest httpServletRequest
    ) {
        requestDto.SetUserId(userId);
        UserReviewResponseDto responseDto = userService.ReviewUser(requestDto);
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
