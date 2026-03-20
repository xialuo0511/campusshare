package com.xialuo.campusshare.enums;

/**
 * 订单状态枚举
 */
public enum OrderStatusEnum {
    /** 待卖家确认 */
    PENDING_SELLER_CONFIRM,
    /** 待线下交易 */
    PENDING_OFFLINE_TRADE,
    /** 待买家确认完成 */
    PENDING_BUYER_CONFIRM,
    /** 已完成 */
    COMPLETED,
    /** 已取消 */
    CANCELED,
    /** 已关闭 */
    CLOSED
}
