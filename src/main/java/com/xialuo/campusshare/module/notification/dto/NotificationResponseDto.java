package com.xialuo.campusshare.module.notification.dto;

import com.xialuo.campusshare.enums.NotificationTypeEnum;
import java.time.LocalDateTime;

/**
 * 通知响应
 */
public class NotificationResponseDto {
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
    /** 关联业务类型 */
    private String relatedBizType;
    /** 关联业务ID */
    private Long relatedBizId;
    /** 已读标记 */
    private Boolean readFlag;
    /** 发送时间 */
    private LocalDateTime sendTime;

    /**
     * 获取通知ID
     */
    public Long GetNotificationId() {
        return notificationId;
    }

    /**
     * 设置通知ID
     */
    public void SetNotificationId(Long notificationId) {
        this.notificationId = notificationId;
    }

    /**
     * 获取接收人ID
     */
    public Long GetReceiverUserId() {
        return receiverUserId;
    }

    /**
     * 设置接收人ID
     */
    public void SetReceiverUserId(Long receiverUserId) {
        this.receiverUserId = receiverUserId;
    }

    /**
     * 获取通知类型
     */
    public NotificationTypeEnum GetNotificationType() {
        return notificationType;
    }

    /**
     * 设置通知类型
     */
    public void SetNotificationType(NotificationTypeEnum notificationType) {
        this.notificationType = notificationType;
    }

    /**
     * 获取标题
     */
    public String GetTitle() {
        return title;
    }

    /**
     * 设置标题
     */
    public void SetTitle(String title) {
        this.title = title;
    }

    /**
     * 获取内容
     */
    public String GetContent() {
        return content;
    }

    /**
     * 设置内容
     */
    public void SetContent(String content) {
        this.content = content;
    }

    /**
     * 获取关联业务类型
     */
    public String GetRelatedBizType() {
        return relatedBizType;
    }

    /**
     * 设置关联业务类型
     */
    public void SetRelatedBizType(String relatedBizType) {
        this.relatedBizType = relatedBizType;
    }

    /**
     * 获取关联业务ID
     */
    public Long GetRelatedBizId() {
        return relatedBizId;
    }

    /**
     * 设置关联业务ID
     */
    public void SetRelatedBizId(Long relatedBizId) {
        this.relatedBizId = relatedBizId;
    }

    /**
     * 获取已读标记
     */
    public Boolean GetReadFlag() {
        return readFlag;
    }

    /**
     * 设置已读标记
     */
    public void SetReadFlag(Boolean readFlag) {
        this.readFlag = readFlag;
    }

    /**
     * 获取发送时间
     */
    public LocalDateTime GetSendTime() {
        return sendTime;
    }

    /**
     * 设置发送时间
     */
    public void SetSendTime(LocalDateTime sendTime) {
        this.sendTime = sendTime;
    }
}
