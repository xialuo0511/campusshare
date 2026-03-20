package com.xialuo.campusshare.entity;

import com.xialuo.campusshare.enums.OrderStatusEnum;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订单实体
 */
public class OrderEntity extends BaseEntity {
    private Long orderId; // 订单ID
    private String orderNo; // 订单号
    private Long productId; // 商品ID
    private Long buyerUserId; // 买家ID
    private Long sellerUserId; // 卖家ID
    private OrderStatusEnum orderStatus; // 订单状态
    private BigDecimal orderAmount; // 订单金额
    private String tradeLocation; // 交易地点
    private LocalDateTime sellerConfirmTime; // 卖家确认时间
    private LocalDateTime buyerCompleteTime; // 买家确认完成时间
    private LocalDateTime closeTime; // 关闭时间
}
