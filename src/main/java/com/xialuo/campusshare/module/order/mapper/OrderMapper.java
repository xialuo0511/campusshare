package com.xialuo.campusshare.module.order.mapper;

import com.xialuo.campusshare.entity.OrderEntity;
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
}
