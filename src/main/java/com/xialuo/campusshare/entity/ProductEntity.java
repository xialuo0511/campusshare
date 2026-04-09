package com.xialuo.campusshare.entity;

import com.xialuo.campusshare.enums.ProductStatusEnum;
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
    /** 卖家ID */
    private Long sellerUserId;
    /** 商品状态 */
    private ProductStatusEnum productStatus;
    /** 是否上架 */
    private Boolean onShelf;
    /** 库存数量 */
    private Integer stockCount;
    /** 是否有有效订单 */
    private Boolean hasEffectiveOrder;

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
     * 获取资源ID
     */
    public Long GetResourceId() {
        return resourceId;
    }

    /**
     * 设置资源ID
     */
    public void SetResourceId(Long resourceId) {
        this.resourceId = resourceId;
    }

    /**
     * 获取分类
     */
    public String GetCategory() {
        return category;
    }

    /**
     * 设置分类
     */
    public void SetCategory(String category) {
        this.category = category;
    }

    /**
     * 获取成色
     */
    public String GetConditionLevel() {
        return conditionLevel;
    }

    /**
     * 设置成色
     */
    public void SetConditionLevel(String conditionLevel) {
        this.conditionLevel = conditionLevel;
    }

    /**
     * 获取价格
     */
    public BigDecimal GetPrice() {
        return price;
    }

    /**
     * 设置价格
     */
    public void SetPrice(BigDecimal price) {
        this.price = price;
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
     * 获取商品状态
     */
    public ProductStatusEnum GetProductStatus() {
        return productStatus;
    }

    /**
     * 设置商品状态
     */
    public void SetProductStatus(ProductStatusEnum productStatus) {
        this.productStatus = productStatus;
    }

    /**
     * 获取上架标记
     */
    public Boolean GetOnShelf() {
        return onShelf;
    }

    /**
     * 设置上架标记
     */
    public void SetOnShelf(Boolean onShelf) {
        this.onShelf = onShelf;
    }

    /**
     * 获取库存
     */
    public Integer GetStockCount() {
        return stockCount;
    }

    /**
     * 设置库存
     */
    public void SetStockCount(Integer stockCount) {
        this.stockCount = stockCount;
    }

    /**
     * 获取有效订单标记
     */
    public Boolean GetHasEffectiveOrder() {
        return hasEffectiveOrder;
    }

    /**
     * 设置有效订单标记
     */
    public void SetHasEffectiveOrder(Boolean hasEffectiveOrder) {
        this.hasEffectiveOrder = hasEffectiveOrder;
    }
}


