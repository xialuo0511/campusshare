package com.xialuo.campusshare.entity;

import com.xialuo.campusshare.enums.NotificationTypeEnum;
import java.time.LocalDateTime;

public class NotificationEntity extends BaseEntity {
    private Long notificationId;
    private Long receiverUserId;
    private NotificationTypeEnum notificationType;
    private String title;
    private String content;
    private Boolean readFlag;
    private LocalDateTime sendTime;
}
