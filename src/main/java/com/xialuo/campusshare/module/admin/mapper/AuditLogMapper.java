package com.xialuo.campusshare.module.admin.mapper;

import com.xialuo.campusshare.entity.AuditLogEntity;
import java.time.LocalDateTime;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 审计日志映射
 */
@Mapper
public interface AuditLogMapper {
    /**
     * 新增审计日志
     */
    Integer InsertAuditLog(AuditLogEntity auditLogEntity);

    /**
     * 分页查询审计日志
     */
    List<AuditLogEntity> ListAuditLogs(
        @Param("offset") Integer offset,
        @Param("pageSize") Integer pageSize,
        @Param("operatorUserId") Long operatorUserId,
        @Param("actionType") String actionType,
        @Param("targetType") String targetType,
        @Param("actionResult") String actionResult
    );

    /**
     * 统计审计日志总数
     */
    Long CountAuditLogs(
        @Param("operatorUserId") Long operatorUserId,
        @Param("actionType") String actionType,
        @Param("targetType") String targetType,
        @Param("actionResult") String actionResult
    );

    /**
     * 统计指定时间后的审计日志
     */
    Long CountAuditLogsCreatedAfter(@Param("startTime") LocalDateTime startTime);
}
