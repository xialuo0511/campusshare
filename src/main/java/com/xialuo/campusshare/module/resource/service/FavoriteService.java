package com.xialuo.campusshare.module.resource.service;

import com.xialuo.campusshare.module.resource.dto.ProductFavoriteResponseDto;
import com.xialuo.campusshare.module.material.dto.MaterialFavoriteResponseDto;
import com.xialuo.campusshare.module.material.dto.MaterialListResponseDto;
import com.xialuo.campusshare.module.resource.dto.ProductListResponseDto;

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

    /**
     * 查询我的商品收藏
     */
    ProductListResponseDto ListMyProductFavorites(Long currentUserId, Integer pageNo, Integer pageSize);

    /**
     * 查询我的资料收藏
     */
    MaterialListResponseDto ListMyMaterialFavorites(Long currentUserId, Integer pageNo, Integer pageSize);
}
