package com.xialuo.campusshare.module.order.mapper;

import com.xialuo.campusshare.entity.OrderEntity;
import com.xialuo.campusshare.enums.OrderStatusEnum;
import java.time.LocalDateTime;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 订单数据映射接口
 */
@Mapper
public interface OrderMapper {
    /**
     * 新增订单
     */
    Integer InsertOrder(OrderEntity orderEntity);

    /**
     * 更新订单
     */
    Integer UpdateOrder(OrderEntity orderEntity);

    /**
     * 按ID查询订单
     */
    OrderEntity FindOrderById(@Param("orderId") Long orderId);

    /**
     * 分页查询订单列表
     */
    List<OrderEntity> ListOrdersByUser(
        @Param("currentUserId") Long currentUserId,
        @Param("isAdministrator") Boolean isAdministrator,
        @Param("offset") Integer offset,
        @Param("pageSize") Integer pageSize,
        @Param("orderStatusList") List<OrderStatusEnum> orderStatusList
    );

    /**
     * 统计订单总数
     */
    Long CountOrdersByUser(
        @Param("currentUserId") Long currentUserId,
        @Param("isAdministrator") Boolean isAdministrator,
        @Param("orderStatusList") List<OrderStatusEnum> orderStatusList
    );

    /**
     * 按状态统计订单数
     */
    Long CountOrdersByUserAndStatus(
        @Param("currentUserId") Long currentUserId,
        @Param("isAdministrator") Boolean isAdministrator,
        @Param("orderStatus") OrderStatusEnum orderStatus
    );

    /**
     * 统计指定时间后的订单数
     */
    Long CountOrdersCreatedAfter(@Param("startTime") LocalDateTime startTime);

    /**
     * 统计买家已完成订单数
     */
    Long CountCompletedOrdersByProductAndBuyer(
        @Param("productId") Long productId,
        @Param("buyerUserId") Long buyerUserId
    );

    /**
     * 关闭商品关联进行中订单
     */
    Integer CloseOngoingOrdersByProductId(
        @Param("productId") Long productId,
        @Param("closeReason") String closeReason,
        @Param("closeTime") LocalDateTime closeTime,
        @Param("updateTime") LocalDateTime updateTime
    );

    /**
     * 查询待卖家确认超时订单
     */
    List<OrderEntity> ListTimeoutPendingSellerConfirmOrders(
        @Param("deadlineTime") LocalDateTime deadlineTime,
        @Param("limit") Integer limit
    );

    /**
     * 查询待买家确认超时订单
     */
    List<OrderEntity> ListTimeoutPendingBuyerConfirmOrders(
        @Param("deadlineTime") LocalDateTime deadlineTime,
        @Param("limit") Integer limit
    );

    /**
     * 统计待卖家确认超时订单数
     */
    Long CountTimeoutPendingSellerConfirmOrders(@Param("deadlineTime") LocalDateTime deadlineTime);

    /**
     * 统计待买家确认超时订单数
     */
    Long CountTimeoutPendingBuyerConfirmOrders(@Param("deadlineTime") LocalDateTime deadlineTime);

    /**
     * 按状态更新订单
     */
    Integer UpdateOrderStatusIfMatch(
        @Param("orderId") Long orderId,
        @Param("fromStatus") OrderStatusEnum fromStatus,
        @Param("toStatus") OrderStatusEnum toStatus,
        @Param("closeReason") String closeReason,
        @Param("closeTime") LocalDateTime closeTime,
        @Param("updateTime") LocalDateTime updateTime
    );
}
