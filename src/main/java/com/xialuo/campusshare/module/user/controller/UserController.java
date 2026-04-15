package com.xialuo.campusshare.module.user.controller;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import com.xialuo.campusshare.common.filter.SessionAuthFilter;
import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.module.user.dto.UserLoginRequestDto;
import com.xialuo.campusshare.module.user.dto.UserLoginResponseDto;
import com.xialuo.campusshare.module.user.dto.UserProfileResponseDto;
import com.xialuo.campusshare.module.user.dto.UserProfileUpdateRequestDto;
import com.xialuo.campusshare.module.user.dto.UserRegisterCodeRequestDto;
import com.xialuo.campusshare.module.user.dto.UserRegisterCodeResponseDto;
import com.xialuo.campusshare.module.user.dto.UserRegisterRequestDto;
import com.xialuo.campusshare.module.user.dto.UserRegisterResponseDto;
import com.xialuo.campusshare.module.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 用户接口
 */
@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    /** 用户服务 */
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * 发送注册验证码
     */
    @PostMapping("/register/code/send")
    public ApiResponse<UserRegisterCodeResponseDto> SendRegisterCode(
        @RequestBody @Valid UserRegisterCodeRequestDto requestDto,
        HttpServletRequest httpServletRequest
    ) {
        UserRegisterCodeResponseDto responseDto = userService.SendRegisterCode(requestDto);
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 用户注册
     */
    @PostMapping("/register")
    public ApiResponse<UserRegisterResponseDto> RegisterUser(
        @RequestBody @Valid UserRegisterRequestDto requestDto,
        HttpServletRequest httpServletRequest
    ) {
        UserRegisterResponseDto responseDto = userService.RegisterUser(requestDto);
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 用户登录
     */
    @PostMapping("/login")
    public ApiResponse<UserLoginResponseDto> LoginUser(
        @RequestBody @Valid UserLoginRequestDto requestDto,
        HttpServletRequest httpServletRequest
    ) {
        UserLoginResponseDto responseDto = userService.LoginUser(requestDto);
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 用户登出
     */
    @PostMapping("/logout")
    public ApiResponse<Object> LogoutUser(HttpServletRequest httpServletRequest) {
        String token = ResolveAuthToken(httpServletRequest);
        userService.LogoutUser(token);
        return ApiResponse.Success(null, GetRequestId(httpServletRequest));
    }

    /**
     * 查询个人资料
     */
    @GetMapping("/{userId}/profile")
    public ApiResponse<UserProfileResponseDto> GetUserProfile(
        @PathVariable("userId") Long userId,
        HttpServletRequest httpServletRequest
    ) {
        ValidateUserAccess(userId, httpServletRequest);
        UserProfileResponseDto responseDto = userService.GetUserProfile(userId);
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 更新个人资料
     */
    @PutMapping("/{userId}/profile")
    public ApiResponse<UserProfileResponseDto> UpdateUserProfile(
        @PathVariable("userId") Long userId,
        @RequestBody @Valid UserProfileUpdateRequestDto requestDto,
        HttpServletRequest httpServletRequest
    ) {
        ValidateUserAccess(userId, httpServletRequest);
        UserProfileResponseDto responseDto = userService.UpdateUserProfile(userId, requestDto);
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
     * 获取登录令牌
     */
    private String ResolveAuthToken(HttpServletRequest httpServletRequest) {
        String token = httpServletRequest.getHeader(SessionAuthFilter.AUTH_TOKEN_HEADER);
        return token == null ? "" : token.trim();
    }

    /**
     * 校验用户访问权限
     */
    private void ValidateUserAccess(Long targetUserId, HttpServletRequest httpServletRequest) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        UserRoleEnum currentUserRole = GetCurrentUserRole(httpServletRequest);
        if (currentUserRole == UserRoleEnum.ADMINISTRATOR) {
            return;
        }
        if (!targetUserId.equals(currentUserId)) {
            throw new BusinessException(BizCodeEnum.FORBIDDEN, "无权访问其他用户资料");
        }
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
