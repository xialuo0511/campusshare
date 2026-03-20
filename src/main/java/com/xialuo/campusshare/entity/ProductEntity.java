package com.xialuo.campusshare.entity;

import java.math.BigDecimal;

public class ProductEntity extends BaseEntity {
    private Long productId;
    private Long resourceId;
    private String category;
    private String conditionLevel;
    private BigDecimal price;
    private String tradeLocation;
    private Integer stockCount;
    private Boolean hasEffectiveOrder;
}
