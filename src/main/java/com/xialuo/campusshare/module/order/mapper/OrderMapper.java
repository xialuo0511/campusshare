package com.xialuo.campusshare.module.order.mapper;

import com.xialuo.campusshare.entity.OrderEntity;
import com.xialuo.campusshare.enums.OrderStatusEnum;
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
        @Param("pageSize") Integer pageSize
    );

    /**
     * 统计订单总数
     */
    Long CountOrdersByUser(
        @Param("currentUserId") Long currentUserId,
        @Param("isAdministrator") Boolean isAdministrator
    );

    /**
     * 按状态统计订单数
     */
    Long CountOrdersByUserAndStatus(
        @Param("currentUserId") Long currentUserId,
        @Param("isAdministrator") Boolean isAdministrator,
        @Param("orderStatus") OrderStatusEnum orderStatus
    );
}

