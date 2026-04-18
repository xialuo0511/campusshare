package com.xialuo.campusshare.module.order.scheduler;

import com.xialuo.campusshare.entity.OrderEntity;
import com.xialuo.campusshare.enums.NotificationTypeEnum;
import com.xialuo.campusshare.enums.OrderStatusEnum;
import com.xialuo.campusshare.module.admin.constant.SystemRuleKeyConstants;
import com.xialuo.campusshare.module.admin.service.SystemRuleConfigService;
import com.xialuo.campusshare.module.notification.service.NotificationService;
import com.xialuo.campusshare.module.order.mapper.OrderMapper;
import com.xialuo.campusshare.module.resource.mapper.ProductMapper;
import java.time.LocalDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 订单自动关单调度器
 */
@Component
@ConditionalOnProperty(
    name = "campusshare.order.scheduler.enabled",
    havingValue = "true",
    matchIfMissing = true
)
public class OrderAutoCloseScheduler {
    /** 日志 */
    private static final Logger LOGGER = LoggerFactory.getLogger(OrderAutoCloseScheduler.class);
    /** 默认待卖家确认超时分钟数 */
    private static final Integer DEFAULT_PENDING_SELLER_CONFIRM_TIMEOUT_MINUTES = 1440;
    /** 默认待买家确认超时分钟数 */
    private static final Integer DEFAULT_PENDING_BUYER_CONFIRM_TIMEOUT_MINUTES = 2880;
    /** 默认批处理数量 */
    private static final Integer DEFAULT_AUTO_CLOSE_BATCH_SIZE = 100;

    /** 订单Mapper */
    private final OrderMapper orderMapper;
    /** 商品Mapper */
    private final ProductMapper productMapper;
    /** 通知服务 */
    private final NotificationService notificationService;
    /** 规则服务 */
    private final SystemRuleConfigService systemRuleConfigService;

    public OrderAutoCloseScheduler(
        OrderMapper orderMapper,
        ProductMapper productMapper,
        NotificationService notificationService,
        SystemRuleConfigService systemRuleConfigService
    ) {
        this.orderMapper = orderMapper;
        this.productMapper = productMapper;
        this.notificationService = notificationService;
        this.systemRuleConfigService = systemRuleConfigService;
    }

    /**
     * 定时处理超时订单
     */
    @Scheduled(fixedDelayString = "${campusshare.order.scheduler.fixed-delay-ms:60000}")
    public void AutoCloseTimeoutOrders() {
        try {
            Boolean enabled = systemRuleConfigService.GetRuleBooleanValueOrDefault(
                SystemRuleKeyConstants.ORDER_AUTO_CLOSE_ENABLED,
                Boolean.TRUE
            );
            if (!Boolean.TRUE.equals(enabled)) {
                return;
            }

            Integer batchSize = ResolveBatchSize();
            Integer pendingSellerTimeoutMinutes = ResolvePendingSellerTimeoutMinutes();
            Integer pendingBuyerTimeoutMinutes = ResolvePendingBuyerTimeoutMinutes();

            LocalDateTime now = LocalDateTime.now();
            LocalDateTime pendingSellerDeadline = now.minusMinutes(pendingSellerTimeoutMinutes);
            LocalDateTime pendingBuyerDeadline = now.minusMinutes(pendingBuyerTimeoutMinutes);

            ProcessTimeoutOrderList(
                orderMapper.ListTimeoutPendingSellerConfirmOrders(pendingSellerDeadline, batchSize),
                OrderStatusEnum.PENDING_SELLER_CONFIRM,
                "卖家超时未确认，系统自动关闭订单",
                now
            );
            ProcessTimeoutOrderList(
                orderMapper.ListTimeoutPendingBuyerConfirmOrders(pendingBuyerDeadline, batchSize),
                OrderStatusEnum.PENDING_BUYER_CONFIRM,
                "买家超时未确认，系统自动关闭订单",
                now
            );
        } catch (Exception exception) {
            LOGGER.warn("Auto close timeout orders failed", exception);
        }
    }

    /**
     * 批量处理超时订单
     */
    private void ProcessTimeoutOrderList(
        List<OrderEntity> timeoutOrderList,
        OrderStatusEnum fromStatus,
        String closeReason,
        LocalDateTime now
    ) {
        if (timeoutOrderList == null || timeoutOrderList.isEmpty()) {
            return;
        }
        for (OrderEntity orderEntity : timeoutOrderList) {
            if (orderEntity == null || orderEntity.GetOrderId() == null) {
                continue;
            }
            TryAutoCloseOrder(orderEntity, fromStatus, closeReason, now);
        }
    }

    /**
     * 尝试自动关单
     */
    private void TryAutoCloseOrder(
        OrderEntity orderEntity,
        OrderStatusEnum fromStatus,
        String closeReason,
        LocalDateTime now
    ) {
        try {
            Integer updatedRows = orderMapper.UpdateOrderStatusIfMatch(
                orderEntity.GetOrderId(),
                fromStatus,
                OrderStatusEnum.CLOSED,
                closeReason,
                now,
                now
            );
            if (updatedRows == null || updatedRows <= 0) {
                return;
            }

            productMapper.ReleaseProductOrderLock(orderEntity.GetProductId(), now);
            SendAutoCloseNotification(orderEntity, closeReason);
        } catch (Exception exception) {
            LOGGER.warn("Auto close timeout order failed, orderId={}", orderEntity.GetOrderId(), exception);
        }
    }

    /**
     * 发送关单通知
     */
    private void SendAutoCloseNotification(OrderEntity orderEntity, String closeReason) {
        String title = "订单已自动关闭";
        String content = "订单号 " + orderEntity.GetOrderNo() + " 因超时未处理已自动关闭。原因：" + closeReason;

        notificationService.CreateNotification(
            orderEntity.GetBuyerUserId(),
            NotificationTypeEnum.ORDER,
            title,
            content,
            "ORDER",
            orderEntity.GetOrderId()
        );
        notificationService.CreateNotification(
            orderEntity.GetSellerUserId(),
            NotificationTypeEnum.ORDER,
            title,
            content,
            "ORDER",
            orderEntity.GetOrderId()
        );
    }

    /**
     * 解析批处理数量
     */
    private Integer ResolveBatchSize() {
        Integer batchSize = systemRuleConfigService.GetRuleIntegerValueOrDefault(
            SystemRuleKeyConstants.ORDER_AUTO_CLOSE_BATCH_SIZE,
            DEFAULT_AUTO_CLOSE_BATCH_SIZE
        );
        if (batchSize == null || batchSize < 1) {
            return DEFAULT_AUTO_CLOSE_BATCH_SIZE;
        }
        return Math.min(batchSize, 500);
    }

    /**
     * 解析待卖家确认超时时间
     */
    private Integer ResolvePendingSellerTimeoutMinutes() {
        Integer timeoutMinutes = systemRuleConfigService.GetRuleIntegerValueOrDefault(
            SystemRuleKeyConstants.ORDER_PENDING_SELLER_CONFIRM_TIMEOUT_MINUTES,
            DEFAULT_PENDING_SELLER_CONFIRM_TIMEOUT_MINUTES
        );
        if (timeoutMinutes == null || timeoutMinutes < 1) {
            return DEFAULT_PENDING_SELLER_CONFIRM_TIMEOUT_MINUTES;
        }
        return timeoutMinutes;
    }

    /**
     * 解析待买家确认超时时间
     */
    private Integer ResolvePendingBuyerTimeoutMinutes() {
        Integer timeoutMinutes = systemRuleConfigService.GetRuleIntegerValueOrDefault(
            SystemRuleKeyConstants.ORDER_PENDING_BUYER_CONFIRM_TIMEOUT_MINUTES,
            DEFAULT_PENDING_BUYER_CONFIRM_TIMEOUT_MINUTES
        );
        if (timeoutMinutes == null || timeoutMinutes < 1) {
            return DEFAULT_PENDING_BUYER_CONFIRM_TIMEOUT_MINUTES;
        }
        return timeoutMinutes;
    }
}
