package com.xialuo.campusshare.entity;

import com.xialuo.campusshare.enums.NotificationTypeEnum;
import java.time.LocalDateTime;

/**
 * 通知实体
 */
public class NotificationEntity extends BaseEntity {
    /** 通知ID */
    private Long notificationId;
    /** 接收人ID */
    private Long receiverUserId;
    /** 通知类型 */
    private NotificationTypeEnum notificationType;
    /** 标题 */
    private String title;
    /** 内容 */
    private String content;
    /** 已读标记 */
    private Boolean readFlag;
    /** 发送时间 */
    private LocalDateTime sendTime;
}


