package com.xialuo.campusshare.module.admin.service;

import com.xialuo.campusshare.module.admin.dto.AdminDashboardSummaryResponseDto;

/**
 * 管理后台看板服务
 */
public interface AdminDashboardService {
    /**
     * 获取后台总览统计
     */
    AdminDashboardSummaryResponseDto GetDashboardSummary();
}
