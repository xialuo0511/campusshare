package com.xialuo.campusshare.module.order.service;

import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.module.order.dto.CreateOrderRequestDto;
import com.xialuo.campusshare.module.order.dto.OrderListResponseDto;
import com.xialuo.campusshare.module.order.dto.OrderResponseDto;

/**
 * 订单服务接口
 */
public interface OrderService {
    /**
     * 创建订单
     */
    OrderResponseDto CreateOrder(CreateOrderRequestDto requestDto, Long currentUserId);

    /**
     * 取消订单
     */
    OrderResponseDto CancelOrder(Long orderId, Long currentUserId, UserRoleEnum currentUserRole);

    /**
     * 卖家确认订单
     */
    OrderResponseDto ConfirmOrder(Long orderId, Long currentUserId);

    /**
     * 买家完成订单
     */
    OrderResponseDto CompleteOrder(Long orderId, Long currentUserId);

    /**
     * 关闭订单
     */
    OrderResponseDto CloseOrder(Long orderId, Long currentUserId, UserRoleEnum currentUserRole, String closeReason);

    /**
     * 查询订单详情
     */
    OrderResponseDto GetOrderDetail(Long orderId, Long currentUserId, UserRoleEnum currentUserRole);

    /**
     * 查询我的订单列表
     */
    OrderListResponseDto ListMyOrders(
        Long currentUserId,
        UserRoleEnum currentUserRole,
        Integer pageNo,
        Integer pageSize,
        String statusFilter
    );
}
