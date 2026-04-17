package com.xialuo.campusshare.module.material.dto;

/**
 * 资料收藏状态响应
 */
public class MaterialFavoriteResponseDto {
    /** 资料ID */
    private Long materialId;
    /** 是否已收藏 */
    private Boolean favorited;
    /** 收藏总数 */
    private Long favoriteCount;

    /**
     * 获取资料ID
     */
    public Long GetMaterialId() {
        return materialId;
    }

    /**
     * 设置资料ID
     */
    public void SetMaterialId(Long materialId) {
        this.materialId = materialId;
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
