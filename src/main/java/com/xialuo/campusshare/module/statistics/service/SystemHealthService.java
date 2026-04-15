package com.xialuo.campusshare.module.statistics.service;

import com.xialuo.campusshare.module.statistics.dto.SystemHealthResponseDto;

/**
 * 系统健康服务接口
 */
public interface SystemHealthService {
    /**
     * 获取系统健康状态
     */
    SystemHealthResponseDto GetSystemHealth();
}

