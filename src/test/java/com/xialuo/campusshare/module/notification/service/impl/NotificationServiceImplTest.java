package com.xialuo.campusshare.module.notification.service.impl;

import com.xialuo.campusshare.enums.NotificationTypeEnum;
import com.xialuo.campusshare.module.notification.mapper.NotificationMapper;
import com.xialuo.campusshare.module.notification.service.NotificationMailTaskService;
import org.junit.jupiter.api.Test;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

/**
 * 通知服务测试
 */
class NotificationServiceImplTest {

    /**
     * 创建站内通知应同步创建邮件任务
     */
    @Test
    void CreateNotificationShouldCreateMailTask() {
        NotificationMapper notificationMapper = mock(NotificationMapper.class);
        NotificationMailTaskService notificationMailTaskService = mock(NotificationMailTaskService.class);
        NotificationServiceImpl service = new NotificationServiceImpl(
            notificationMapper,
            notificationMailTaskService
        );

        service.CreateNotification(
            1001L,
            NotificationTypeEnum.ORDER,
            "订单状态变更",
            "订单已自动关闭",
            "ORDER",
            9001L
        );

        verify(notificationMapper, times(1)).InsertNotification(org.mockito.ArgumentMatchers.any());
        verify(notificationMailTaskService, times(1)).CreateMailTask(
            eq(1001L),
            eq(NotificationTypeEnum.ORDER),
            eq("订单状态变更"),
            eq("订单已自动关闭"),
            eq("ORDER"),
            eq(9001L)
        );
    }
}
