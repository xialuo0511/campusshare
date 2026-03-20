package com.xialuo.campusshare.entity;

import java.math.BigDecimal;

/**
 * 商品实体
 */
public class ProductEntity extends BaseEntity {
    /** 商品ID */
    private Long productId;
    /** 关联资源ID */
    private Long resourceId;
    /** 商品分类 */
    private String category;
    /** 成色 */
    private String conditionLevel;
    /** 价格 */
    private BigDecimal price;
    /** 交易地点 */
    private String tradeLocation;
    /** 库存数量 */
    private Integer stockCount;
    /** 是否有有效订单 */
    private Boolean hasEffectiveOrder;
}


