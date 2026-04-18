package com.xialuo.campusshare.module.admin.service.impl;

import com.xialuo.campusshare.module.admin.constant.SystemRuleKeyConstants;
import com.xialuo.campusshare.module.admin.dto.AdminOpsSummaryResponseDto;
import com.xialuo.campusshare.module.admin.service.AdminOpsService;
import com.xialuo.campusshare.module.admin.service.SystemRuleConfigService;
import com.xialuo.campusshare.module.notification.mapper.NotificationMailTaskMapper;
import com.xialuo.campusshare.module.order.mapper.OrderMapper;
import com.xialuo.campusshare.module.statistics.dto.SystemHealthResponseDto;
import com.xialuo.campusshare.module.statistics.service.SystemHealthService;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;

/**
 * 管理后台运行态服务实现
 */
@Service
public class AdminOpsServiceImpl implements AdminOpsService {
    /** 任务状态:待派发 */
    private static final String DISPATCH_STATUS_PENDING = "PENDING";
    /** 任务状态:派发失败 */
    private static final String DISPATCH_STATUS_FAILED = "FAILED";
    /** 默认待卖家确认超时时间(分钟) */
    private static final Integer DEFAULT_PENDING_SELLER_CONFIRM_TIMEOUT_MINUTES = 1440;
    /** 默认待买家确认超时时间(分钟) */
    private static final Integer DEFAULT_PENDING_BUYER_CONFIRM_TIMEOUT_MINUTES = 2880;

    /** 系统健康服务 */
    private final SystemHealthService systemHealthService;
    /** 邮件任务Mapper */
    private final NotificationMailTaskMapper notificationMailTaskMapper;
    /** 订单Mapper */
    private final OrderMapper orderMapper;
    /** 规则配置服务 */
    private final SystemRuleConfigService systemRuleConfigService;

    public AdminOpsServiceImpl(
        SystemHealthService systemHealthService,
        NotificationMailTaskMapper notificationMailTaskMapper,
        OrderMapper orderMapper,
        SystemRuleConfigService systemRuleConfigService
    ) {
        this.systemHealthService = systemHealthService;
        this.notificationMailTaskMapper = notificationMailTaskMapper;
        this.orderMapper = orderMapper;
        this.systemRuleConfigService = systemRuleConfigService;
    }

    @Override
    public AdminOpsSummaryResponseDto GetOpsSummary() {
        LocalDateTime currentTime = LocalDateTime.now();
        Integer pendingSellerTimeoutMinutes = ResolvePendingSellerTimeoutMinutes();
        Integer pendingBuyerTimeoutMinutes = ResolvePendingBuyerTimeoutMinutes();

        SystemHealthResponseDto healthResponseDto = systemHealthService.GetSystemHealth();

        AdminOpsSummaryResponseDto responseDto = new AdminOpsSummaryResponseDto();
        responseDto.SetOverallStatus(healthResponseDto.GetOverallStatus());
        responseDto.SetDatabaseStatus(healthResponseDto.GetDatabaseStatus());
        responseDto.SetRedisStatus(healthResponseDto.GetRedisStatus());
        responseDto.SetPendingMailTaskCount(
            SafeCount(notificationMailTaskMapper.CountMailTasksByStatus(DISPATCH_STATUS_PENDING))
        );
        responseDto.SetFailedMailTaskCount(
            SafeCount(notificationMailTaskMapper.CountMailTasksByStatus(DISPATCH_STATUS_FAILED))
        );
        responseDto.SetTimeoutPendingSellerConfirmOrderCount(
            SafeCount(
                orderMapper.CountTimeoutPendingSellerConfirmOrders(
                    currentTime.minusMinutes(pendingSellerTimeoutMinutes)
                )
            )
        );
        responseDto.SetTimeoutPendingBuyerConfirmOrderCount(
            SafeCount(
                orderMapper.CountTimeoutPendingBuyerConfirmOrders(
                    currentTime.minusMinutes(pendingBuyerTimeoutMinutes)
                )
            )
        );
        responseDto.SetGenerateTime(currentTime);
        return responseDto;
    }

    /**
     * 解析待卖家确认超时分钟
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
     * 解析待买家确认超时分钟
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

    /**
     * 统计兜底
     */
    private Long SafeCount(Long count) {
        return count == null ? 0L : count;
    }
}
