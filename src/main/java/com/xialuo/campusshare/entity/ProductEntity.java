package com.xialuo.campusshare.entity;

import java.math.BigDecimal;

/**
 * 商品实体
 */
public class ProductEntity extends BaseEntity {
    private Long productId; // 商品ID
    private Long resourceId; // 关联资源ID
    private String category; // 商品分类
    private String conditionLevel; // 成色
    private BigDecimal price; // 价格
    private String tradeLocation; // 交易地点
    private Integer stockCount; // 库存数量
    private Boolean hasEffectiveOrder; // 是否有有效订单
}
