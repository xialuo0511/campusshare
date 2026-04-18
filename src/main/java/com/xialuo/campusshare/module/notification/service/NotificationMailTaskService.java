package com.xialuo.campusshare.module.notification.service;

import com.xialuo.campusshare.enums.NotificationTypeEnum;

/**
 * 通知邮件任务服务
 */
public interface NotificationMailTaskService {
    /**
     * 创建邮件任务
     */
    void CreateMailTask(
        Long receiverUserId,
        NotificationTypeEnum notificationType,
        String mailSubject,
        String mailContent,
        String relatedBizType,
        Long relatedBizId
    );

    /**
     * 派发待发送邮件任务
     */
    void DispatchPendingMailTasks();
}
