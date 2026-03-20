package com.xialuo.campusshare.entity;

import com.xialuo.campusshare.enums.OrderStatusEnum;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class OrderEntity extends BaseEntity {
    private Long orderId;
    private String orderNo;
    private Long productId;
    private Long buyerUserId;
    private Long sellerUserId;
    private OrderStatusEnum orderStatus;
    private BigDecimal orderAmount;
    private String tradeLocation;
    private LocalDateTime sellerConfirmTime;
    private LocalDateTime buyerCompleteTime;
    private LocalDateTime closeTime;
}
