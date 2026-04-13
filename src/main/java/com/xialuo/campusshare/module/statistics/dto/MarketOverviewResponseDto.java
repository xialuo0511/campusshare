package com.xialuo.campusshare.module.statistics.dto;

import java.util.List;

/**
 * 市场总览响应
 */
public class MarketOverviewResponseDto {
    /** 在架商品总数 */
    private Long publishedProductCount;
    /** 已发布资料总数 */
    private Long publishedMaterialCount;
    /** 推荐商品 */
    private List<MarketOverviewProductDto> recommendedProductList;
    /** 精选资料 */
    private List<MarketOverviewMaterialDto> featuredMaterialList;

    /**
     * 获取在架商品总数
     */
    public Long GetPublishedProductCount() {
        return publishedProductCount;
    }

    /**
     * 设置在架商品总数
     */
    public void SetPublishedProductCount(Long publishedProductCount) {
        this.publishedProductCount = publishedProductCount;
    }

    /**
     * 获取已发布资料总数
     */
    public Long GetPublishedMaterialCount() {
        return publishedMaterialCount;
    }

    /**
     * 设置已发布资料总数
     */
    public void SetPublishedMaterialCount(Long publishedMaterialCount) {
        this.publishedMaterialCount = publishedMaterialCount;
    }

    /**
     * 获取推荐商品
     */
    public List<MarketOverviewProductDto> GetRecommendedProductList() {
        return recommendedProductList;
    }

    /**
     * 设置推荐商品
     */
    public void SetRecommendedProductList(List<MarketOverviewProductDto> recommendedProductList) {
        this.recommendedProductList = recommendedProductList;
    }

    /**
     * 获取精选资料
     */
    public List<MarketOverviewMaterialDto> GetFeaturedMaterialList() {
        return featuredMaterialList;
    }

    /**
     * 设置精选资料
     */
    public void SetFeaturedMaterialList(List<MarketOverviewMaterialDto> featuredMaterialList) {
        this.featuredMaterialList = featuredMaterialList;
    }
}
