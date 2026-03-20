package com.xialuo.campusshare.entity;

import com.xialuo.campusshare.enums.OrderStatusEnum;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订单实体
 */
public class OrderEntity extends BaseEntity {
    /** 订单ID */
    private Long orderId;
    /** 订单号 */
    private String orderNo;
    /** 商品ID */
    private Long productId;
    /** 买家ID */
    private Long buyerUserId;
    /** 卖家ID */
    private Long sellerUserId;
    /** 订单状态 */
    private OrderStatusEnum orderStatus;
    /** 订单金额 */
    private BigDecimal orderAmount;
    /** 交易地点 */
    private String tradeLocation;
    /** 卖家确认时间 */
    private LocalDateTime sellerConfirmTime;
    /** 买家确认完成时间 */
    private LocalDateTime buyerCompleteTime;
    /** 关闭时间 */
    private LocalDateTime closeTime;
}


