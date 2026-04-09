package com.xialuo.campusshare.module.order.dto;

import com.xialuo.campusshare.enums.OrderStatusEnum;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订单响应
 */
public class OrderResponseDto {
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
    /** 状态 */
    private OrderStatusEnum orderStatus;
    /** 金额 */
    private BigDecimal orderAmount;
    /** 交易地点 */
    private String tradeLocation;
    /** 卖家确认时间 */
    private LocalDateTime sellerConfirmTime;
    /** 买家确认完成时间 */
    private LocalDateTime buyerCompleteTime;
    /** 关闭时间 */
    private LocalDateTime closeTime;
    /** 关闭原因 */
    private String closeReason;

    /**
     * 获取订单ID
     */
    public Long GetOrderId() {
        return orderId;
    }

    /**
     * 设置订单ID
     */
    public void SetOrderId(Long orderId) {
        this.orderId = orderId;
    }

    /**
     * 获取订单号
     */
    public String GetOrderNo() {
        return orderNo;
    }

    /**
     * 设置订单号
     */
    public void SetOrderNo(String orderNo) {
        this.orderNo = orderNo;
    }

    /**
     * 获取商品ID
     */
    public Long GetProductId() {
        return productId;
    }

    /**
     * 设置商品ID
     */
    public void SetProductId(Long productId) {
        this.productId = productId;
    }

    /**
     * 获取买家ID
     */
    public Long GetBuyerUserId() {
        return buyerUserId;
    }

    /**
     * 设置买家ID
     */
    public void SetBuyerUserId(Long buyerUserId) {
        this.buyerUserId = buyerUserId;
    }

    /**
     * 获取卖家ID
     */
    public Long GetSellerUserId() {
        return sellerUserId;
    }

    /**
     * 设置卖家ID
     */
    public void SetSellerUserId(Long sellerUserId) {
        this.sellerUserId = sellerUserId;
    }

    /**
     * 获取状态
     */
    public OrderStatusEnum GetOrderStatus() {
        return orderStatus;
    }

    /**
     * 设置状态
     */
    public void SetOrderStatus(OrderStatusEnum orderStatus) {
        this.orderStatus = orderStatus;
    }

    /**
     * 获取金额
     */
    public BigDecimal GetOrderAmount() {
        return orderAmount;
    }

    /**
     * 设置金额
     */
    public void SetOrderAmount(BigDecimal orderAmount) {
        this.orderAmount = orderAmount;
    }

    /**
     * 获取交易地点
     */
    public String GetTradeLocation() {
        return tradeLocation;
    }

    /**
     * 设置交易地点
     */
    public void SetTradeLocation(String tradeLocation) {
        this.tradeLocation = tradeLocation;
    }

    /**
     * 获取卖家确认时间
     */
    public LocalDateTime GetSellerConfirmTime() {
        return sellerConfirmTime;
    }

    /**
     * 设置卖家确认时间
     */
    public void SetSellerConfirmTime(LocalDateTime sellerConfirmTime) {
        this.sellerConfirmTime = sellerConfirmTime;
    }

    /**
     * 获取买家确认完成时间
     */
    public LocalDateTime GetBuyerCompleteTime() {
        return buyerCompleteTime;
    }

    /**
     * 设置买家确认完成时间
     */
    public void SetBuyerCompleteTime(LocalDateTime buyerCompleteTime) {
        this.buyerCompleteTime = buyerCompleteTime;
    }

    /**
     * 获取关闭时间
     */
    public LocalDateTime GetCloseTime() {
        return closeTime;
    }

    /**
     * 设置关闭时间
     */
    public void SetCloseTime(LocalDateTime closeTime) {
        this.closeTime = closeTime;
    }

    /**
     * 获取关闭原因
     */
    public String GetCloseReason() {
        return closeReason;
    }

    /**
     * 设置关闭原因
     */
    public void SetCloseReason(String closeReason) {
        this.closeReason = closeReason;
    }
}
