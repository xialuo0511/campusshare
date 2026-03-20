package com.xialuo.campusshare.entity;

import com.xialuo.campusshare.enums.NotificationTypeEnum;
import java.time.LocalDateTime;

/**
 * 通知实体
 */
public class NotificationEntity extends BaseEntity {
    private Long notificationId; // 通知ID
    private Long receiverUserId; // 接收人ID
    private NotificationTypeEnum notificationType; // 通知类型
    private String title; // 标题
    private String content; // 内容
    private Boolean readFlag; // 已读标记
    private LocalDateTime sendTime; // 发送时间
}
