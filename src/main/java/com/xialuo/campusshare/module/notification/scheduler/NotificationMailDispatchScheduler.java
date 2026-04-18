package com.xialuo.campusshare.module.notification.scheduler;

import com.xialuo.campusshare.module.notification.service.NotificationMailTaskService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 邮件通知派发调度器
 */
@Component
@ConditionalOnProperty(
    name = "campusshare.mail.dispatch.scheduler.enabled",
    havingValue = "true",
    matchIfMissing = true
)
public class NotificationMailDispatchScheduler {
    /** 日志 */
    private static final Logger LOGGER = LoggerFactory.getLogger(NotificationMailDispatchScheduler.class);

    /** 邮件任务服务 */
    private final NotificationMailTaskService notificationMailTaskService;

    public NotificationMailDispatchScheduler(NotificationMailTaskService notificationMailTaskService) {
        this.notificationMailTaskService = notificationMailTaskService;
    }

    /**
     * 定时派发邮件任务
     */
    @Scheduled(fixedDelayString = "${campusshare.mail.dispatch.fixed-delay-ms:60000}")
    public void DispatchMailTasks() {
        try {
            notificationMailTaskService.DispatchPendingMailTasks();
        } catch (Exception exception) {
            LOGGER.warn("Dispatch mail tasks failed", exception);
        }
    }
}
