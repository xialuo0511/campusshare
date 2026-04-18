package com.xialuo.campusshare.module.admin.service;

import com.xialuo.campusshare.module.admin.dto.AdminOpsSummaryResponseDto;

/**
 * 管理后台运行态服务
 */
public interface AdminOpsService {
    /**
     * 获取运行态总览
     */
    AdminOpsSummaryResponseDto GetOpsSummary();
}
