package com.xialuo.campusshare.enums;

/**
 * 商品状态枚举
 */
public enum ProductStatusEnum {
    /** 待审核 */
    PENDING_REVIEW,
    /** 已上架 */
    PUBLISHED,
    /** 审核驳回 */
    REJECTED,
    /** 用户主动下架 */
    OFFLINE,
    /** 管理员强制下线 */
    FORCE_OFFLINE,
    /** 订单锁定 */
    LOCKED,
    /** 已关闭 */
    CLOSED
}
