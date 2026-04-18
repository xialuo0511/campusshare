package com.xialuo.campusshare.entity;

import java.time.LocalDateTime;

/**
 * 通知邮件任务实体
 */
public class NotificationMailTaskEntity extends BaseEntity {
    /** 任务ID */
    private Long mailTaskId;
    /** 接收用户ID */
    private Long receiverUserId;
    /** 接收邮箱 */
    private String receiverEmail;
    /** 通知类型 */
    private String notificationType;
    /** 邮件主题 */
    private String mailSubject;
    /** 邮件内容 */
    private String mailContent;
    /** 关联业务类型 */
    private String relatedBizType;
    /** 关联业务ID */
    private Long relatedBizId;
    /** 发送状态 */
    private String dispatchStatus;
    /** 重试次数 */
    private Integer retryCount;
    /** 最大重试次数 */
    private Integer maxRetryCount;
    /** 下次重试时间 */
    private LocalDateTime nextRetryTime;
    /** 最近失败原因 */
    private String lastFailReason;
    /** 发送时间 */
    private LocalDateTime sendTime;

    /**
     * 获取任务ID
     */
    public Long GetMailTaskId() {
        return mailTaskId;
    }

    /**
     * 设置任务ID
     */
    public void SetMailTaskId(Long mailTaskId) {
        this.mailTaskId = mailTaskId;
    }

    /**
     * 获取接收用户ID
     */
    public Long GetReceiverUserId() {
        return receiverUserId;
    }

    /**
     * 设置接收用户ID
     */
    public void SetReceiverUserId(Long receiverUserId) {
        this.receiverUserId = receiverUserId;
    }

    /**
     * 获取接收邮箱
     */
    public String GetReceiverEmail() {
        return receiverEmail;
    }

    /**
     * 设置接收邮箱
     */
    public void SetReceiverEmail(String receiverEmail) {
        this.receiverEmail = receiverEmail;
    }

    /**
     * 获取通知类型
     */
    public String GetNotificationType() {
        return notificationType;
    }

    /**
     * 设置通知类型
     */
    public void SetNotificationType(String notificationType) {
        this.notificationType = notificationType;
    }

    /**
     * 获取邮件主题
     */
    public String GetMailSubject() {
        return mailSubject;
    }

    /**
     * 设置邮件主题
     */
    public void SetMailSubject(String mailSubject) {
        this.mailSubject = mailSubject;
    }

    /**
     * 获取邮件内容
     */
    public String GetMailContent() {
        return mailContent;
    }

    /**
     * 设置邮件内容
     */
    public void SetMailContent(String mailContent) {
        this.mailContent = mailContent;
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
     * 获取发送状态
     */
    public String GetDispatchStatus() {
        return dispatchStatus;
    }

    /**
     * 设置发送状态
     */
    public void SetDispatchStatus(String dispatchStatus) {
        this.dispatchStatus = dispatchStatus;
    }

    /**
     * 获取重试次数
     */
    public Integer GetRetryCount() {
        return retryCount;
    }

    /**
     * 设置重试次数
     */
    public void SetRetryCount(Integer retryCount) {
        this.retryCount = retryCount;
    }

    /**
     * 获取最大重试次数
     */
    public Integer GetMaxRetryCount() {
        return maxRetryCount;
    }

    /**
     * 设置最大重试次数
     */
    public void SetMaxRetryCount(Integer maxRetryCount) {
        this.maxRetryCount = maxRetryCount;
    }

    /**
     * 获取下次重试时间
     */
    public LocalDateTime GetNextRetryTime() {
        return nextRetryTime;
    }

    /**
     * 设置下次重试时间
     */
    public void SetNextRetryTime(LocalDateTime nextRetryTime) {
        this.nextRetryTime = nextRetryTime;
    }

    /**
     * 获取最近失败原因
     */
    public String GetLastFailReason() {
        return lastFailReason;
    }

    /**
     * 设置最近失败原因
     */
    public void SetLastFailReason(String lastFailReason) {
        this.lastFailReason = lastFailReason;
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
