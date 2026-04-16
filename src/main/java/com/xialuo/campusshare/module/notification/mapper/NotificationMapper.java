package com.xialuo.campusshare.module.notification.mapper;

import com.xialuo.campusshare.entity.NotificationEntity;
import java.time.LocalDateTime;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 通知数据映射接口
 */
@Mapper
public interface NotificationMapper {
    /**
     * 新增通知
     */
    Integer InsertNotification(NotificationEntity notificationEntity);

    /**
     * 更新通知
     */
    Integer UpdateNotification(NotificationEntity notificationEntity);

    /**
     * 按ID查询通知
     */
    NotificationEntity FindNotificationById(@Param("notificationId") Long notificationId);

    /**
     * 查询用户通知
     */
    List<NotificationEntity> ListNotificationsByReceiverUserId(@Param("receiverUserId") Long receiverUserId);

    /**
     * 批量标记已读
     */
    Long UpdateAllUnreadToReadByReceiverUserId(
        @Param("receiverUserId") Long receiverUserId,
        @Param("updateTime") LocalDateTime updateTime
    );
}
