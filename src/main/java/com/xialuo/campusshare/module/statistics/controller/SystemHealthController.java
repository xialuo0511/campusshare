package com.xialuo.campusshare.module.statistics.controller;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import com.xialuo.campusshare.module.statistics.dto.SystemHealthResponseDto;
import com.xialuo.campusshare.module.statistics.service.SystemHealthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 系统健康接口
 */
@RestController
@RequestMapping("/api/v1/system")
public class SystemHealthController {
    /** 系统健康服务 */
    private final SystemHealthService systemHealthService;

    public SystemHealthController(SystemHealthService systemHealthService) {
        this.systemHealthService = systemHealthService;
    }

    /**
     * 健康检查
     */
    @GetMapping("/health")
    public ApiResponse<SystemHealthResponseDto> GetSystemHealth(HttpServletRequest httpServletRequest) {
        SystemHealthResponseDto responseDto = systemHealthService.GetSystemHealth();
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

