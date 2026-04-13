package com.xialuo.campusshare.module.statistics.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 总览商品信息
 */
public class MarketOverviewProductDto {
    /** 商品ID */
    private Long productId;
    /** 标题 */
    private String title;
    /** 成色 */
    private String conditionLevel;
    /** 价格 */
    private BigDecimal price;
    /** 地点 */
    private String tradeLocation;
    /** 卖家昵称 */
    private String sellerDisplayName;
    /** 发布时间 */
    private LocalDateTime createTime;

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
     * 获取标题
     */
    public String GetTitle() {
        return title;
    }

    /**
     * 设置标题
     */
    public void SetTitle(String title) {
        this.title = title;
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
     * 获取地点
     */
    public String GetTradeLocation() {
        return tradeLocation;
    }

    /**
     * 设置地点
     */
    public void SetTradeLocation(String tradeLocation) {
        this.tradeLocation = tradeLocation;
    }

    /**
     * 获取卖家昵称
     */
    public String GetSellerDisplayName() {
        return sellerDisplayName;
    }

    /**
     * 设置卖家昵称
     */
    public void SetSellerDisplayName(String sellerDisplayName) {
        this.sellerDisplayName = sellerDisplayName;
    }

    /**
     * 获取发布时间
     */
    public LocalDateTime GetCreateTime() {
        return createTime;
    }

    /**
     * 设置发布时间
     */
    public void SetCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }
}
