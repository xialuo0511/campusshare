package com.xialuo.campusshare.module.resource.dto;

/**
 * 商品收藏状态响应
 */
public class ProductFavoriteResponseDto {
    /** 商品ID */
    private Long productId;
    /** 是否已收藏 */
    private Boolean favorited;
    /** 收藏总数 */
    private Long favoriteCount;

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
     * 获取收藏标记
     */
    public Boolean GetFavorited() {
        return favorited;
    }

    /**
     * 设置收藏标记
     */
    public void SetFavorited(Boolean favorited) {
        this.favorited = favorited;
    }

    /**
     * 获取收藏总数
     */
    public Long GetFavoriteCount() {
        return favoriteCount;
    }

    /**
     * 设置收藏总数
     */
    public void SetFavoriteCount(Long favoriteCount) {
        this.favoriteCount = favoriteCount;
    }
}
