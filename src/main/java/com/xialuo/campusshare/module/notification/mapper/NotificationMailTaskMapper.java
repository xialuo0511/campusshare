package com.xialuo.campusshare.module.notification.mapper;

import com.xialuo.campusshare.entity.NotificationMailTaskEntity;
import java.time.LocalDateTime;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 通知邮件任务Mapper
 */
@Mapper
public interface NotificationMailTaskMapper {
    /**
     * 新增邮件任务
     */
    Integer InsertMailTask(NotificationMailTaskEntity mailTaskEntity);

    /**
     * 查询可发送任务
     */
    List<NotificationMailTaskEntity> ListDispatchableTasks(
        @Param("dispatchStatus") String dispatchStatus,
        @Param("currentTime") LocalDateTime currentTime,
        @Param("limit") Integer limit
    );

    /**
     * 标记任务发送成功
     */
    Integer MarkDispatchSuccess(
        @Param("mailTaskId") Long mailTaskId,
        @Param("sendTime") LocalDateTime sendTime,
        @Param("updateTime") LocalDateTime updateTime
    );

    /**
     * 更新任务重试状态
     */
    Integer UpdateRetryState(
        @Param("mailTaskId") Long mailTaskId,
        @Param("retryCount") Integer retryCount,
        @Param("nextRetryTime") LocalDateTime nextRetryTime,
        @Param("lastFailReason") String lastFailReason,
        @Param("updateTime") LocalDateTime updateTime
    );

    /**
     * 标记任务最终失败
     */
    Integer MarkDispatchFailed(
        @Param("mailTaskId") Long mailTaskId,
        @Param("retryCount") Integer retryCount,
        @Param("lastFailReason") String lastFailReason,
        @Param("updateTime") LocalDateTime updateTime
    );

    /**
     * 按状态统计邮件任务数
     */
    Long CountMailTasksByStatus(@Param("dispatchStatus") String dispatchStatus);
}
