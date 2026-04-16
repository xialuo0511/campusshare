package com.xialuo.campusshare.module.notification.service;

import com.xialuo.campusshare.enums.NotificationTypeEnum;
import com.xialuo.campusshare.module.notification.dto.NotificationResponseDto;
import java.util.List;

/**
 * 通知服务接口
 */
public interface NotificationService {
    /**
     * 创建单条通知
     */
    void CreateNotification(
        Long receiverUserId,
        NotificationTypeEnum notificationType,
        String title,
        String content,
        String relatedBizType,
        Long relatedBizId
    );

    /**
     * 批量创建通知
     */
    void BatchCreateNotification(
        List<Long> receiverUserIds,
        NotificationTypeEnum notificationType,
        String title,
        String content,
        String relatedBizType,
        Long relatedBizId
    );

    /**
     * 查询用户通知
     */
    List<NotificationResponseDto> ListUserNotifications(Long receiverUserId);

    /**
     * 标记通知已读
     */
    NotificationResponseDto MarkNotificationRead(Long notificationId, Long receiverUserId);

    /**
     * 全部标记已读
     */
    Long MarkAllNotificationRead(Long receiverUserId);
}
