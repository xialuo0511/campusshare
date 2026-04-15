package com.xialuo.campusshare.module.resource.dto;

import com.xialuo.campusshare.enums.ProductStatusEnum;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 商品摘要响应
 */
public class ProductSummaryResponseDto {
    /** 商品ID */
    private Long productId;
    /** 标题 */
    private String title;
    /** 分类 */
    private String category;
    /** 成色 */
    private String conditionLevel;
    /** 价格 */
    private BigDecimal price;
    /** 交易地点 */
    private String tradeLocation;
    /** 卖家ID */
    private Long sellerUserId;
    /** 卖家名称 */
    private String sellerDisplayName;
    /** 图片文件ID列表 */
    private List<String> imageFileIds;
    /** 状态 */
    private ProductStatusEnum productStatus;
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
     * 获取卖家名称
     */
    public String GetSellerDisplayName() {
        return sellerDisplayName;
    }

    /**
     * 设置卖家名称
     */
    public void SetSellerDisplayName(String sellerDisplayName) {
        this.sellerDisplayName = sellerDisplayName;
    }

    /**
     * 获取图片文件ID列表
     */
    public List<String> GetImageFileIds() {
        return imageFileIds;
    }

    /**
     * 设置图片文件ID列表
     */
    public void SetImageFileIds(List<String> imageFileIds) {
        this.imageFileIds = imageFileIds;
    }

    /**
     * 获取状态
     */
    public ProductStatusEnum GetProductStatus() {
        return productStatus;
    }

    /**
     * 设置状态
     */
    public void SetProductStatus(ProductStatusEnum productStatus) {
        this.productStatus = productStatus;
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
