package com.xialuo.campusshare.module.resource.service;

import com.xialuo.campusshare.module.resource.dto.ProductFavoriteResponseDto;
import com.xialuo.campusshare.module.material.dto.MaterialFavoriteResponseDto;

/**
 * 收藏服务
 */
public interface FavoriteService {
    /**
     * 查询商品收藏状态
     */
    ProductFavoriteResponseDto GetProductFavoriteState(Long productId, Long currentUserId);

    /**
     * 切换商品收藏状态
     */
    ProductFavoriteResponseDto ToggleProductFavorite(Long productId, Long currentUserId);

    /**
     * 查询资料收藏状态
     */
    MaterialFavoriteResponseDto GetMaterialFavoriteState(Long materialId, Long currentUserId);

    /**
     * 切换资料收藏状态
     */
    MaterialFavoriteResponseDto ToggleMaterialFavorite(Long materialId, Long currentUserId);
}
