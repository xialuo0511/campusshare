package com.xialuo.campusshare.module.notification.controller;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import com.xialuo.campusshare.common.filter.SessionAuthFilter;
import com.xialuo.campusshare.module.notification.dto.NotificationResponseDto;
import com.xialuo.campusshare.module.notification.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 通知接口
 */
@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {
    /** 通知服务 */
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * 查询我的通知
     */
    @GetMapping
    public ApiResponse<List<NotificationResponseDto>> ListMyNotifications(HttpServletRequest httpServletRequest) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        List<NotificationResponseDto> responseDtoList = notificationService.ListUserNotifications(currentUserId);
        return ApiResponse.Success(responseDtoList, GetRequestId(httpServletRequest));
    }

    /**
     * 标记通知已读
     */
    @PostMapping("/{notificationId}/read")
    public ApiResponse<NotificationResponseDto> MarkNotificationRead(
        @PathVariable("notificationId") Long notificationId,
        HttpServletRequest httpServletRequest
    ) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        NotificationResponseDto responseDto = notificationService.MarkNotificationRead(notificationId, currentUserId);
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 全部标记已读
     */
    @PostMapping("/read/all")
    public ApiResponse<Long> MarkAllNotificationRead(HttpServletRequest httpServletRequest) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        Long affectedCount = notificationService.MarkAllNotificationRead(currentUserId);
        return ApiResponse.Success(affectedCount, GetRequestId(httpServletRequest));
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
}
