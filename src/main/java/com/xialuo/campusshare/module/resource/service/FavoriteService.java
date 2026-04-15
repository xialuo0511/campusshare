package com.xialuo.campusshare.module.resource.service;

import com.xialuo.campusshare.module.resource.dto.ProductFavoriteResponseDto;

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
}
