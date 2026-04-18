package com.xialuo.campusshare.module.admin.service;

import com.xialuo.campusshare.module.admin.dto.AuditLogListResponseDto;

/**
 * 审计日志服务
 */
public interface AuditLogService {
    /**
     * 记录审计日志
     */
    void RecordAuditLog(
        Long operatorUserId,
        String actionType,
        String targetType,
        Long targetId,
        String actionResult,
        String actionDetail
    );

    /**
     * 分页查询审计日志
     */
    AuditLogListResponseDto ListAuditLogs(
        Integer pageNo,
        Integer pageSize,
        Long operatorUserId,
        String actionType,
        String targetType,
        String actionResult
    );
}

