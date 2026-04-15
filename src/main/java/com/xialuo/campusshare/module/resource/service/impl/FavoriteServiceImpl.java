package com.xialuo.campusshare.module.resource.service.impl;

import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.entity.FavoriteEntity;
import com.xialuo.campusshare.entity.ProductEntity;
import com.xialuo.campusshare.module.resource.dto.ProductFavoriteResponseDto;
import com.xialuo.campusshare.module.resource.mapper.FavoriteMapper;
import com.xialuo.campusshare.module.resource.mapper.ProductMapper;
import com.xialuo.campusshare.module.resource.service.FavoriteService;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 收藏服务实现
 */
@Service
public class FavoriteServiceImpl implements FavoriteService {
    /** 收藏Mapper */
    private final FavoriteMapper favoriteMapper;
    /** 商品Mapper */
    private final ProductMapper productMapper;

    public FavoriteServiceImpl(FavoriteMapper favoriteMapper, ProductMapper productMapper) {
        this.favoriteMapper = favoriteMapper;
        this.productMapper = productMapper;
    }

    @Override
    public ProductFavoriteResponseDto GetProductFavoriteState(Long productId, Long currentUserId) {
        ValidateCurrentUser(currentUserId);
        ValidateProduct(productId);
        FavoriteEntity favoriteEntity = favoriteMapper.FindByUserIdAndResourceId(currentUserId, productId);
        boolean favorited = favoriteEntity != null && !Boolean.TRUE.equals(favoriteEntity.GetCanceled());
        Long favoriteCount = favoriteMapper.CountActiveByResourceId(productId);
        return BuildResponse(productId, favorited, favoriteCount);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ProductFavoriteResponseDto ToggleProductFavorite(Long productId, Long currentUserId) {
        ValidateCurrentUser(currentUserId);
        ValidateProduct(productId);

        FavoriteEntity favoriteEntity = favoriteMapper.FindByUserIdAndResourceId(currentUserId, productId);
        LocalDateTime now = LocalDateTime.now();
        boolean favorited;
        if (favoriteEntity == null) {
            FavoriteEntity newFavoriteEntity = new FavoriteEntity();
            newFavoriteEntity.SetUserId(currentUserId);
            newFavoriteEntity.SetResourceId(productId);
            newFavoriteEntity.SetCanceled(Boolean.FALSE);
            newFavoriteEntity.SetCreateTime(now);
            newFavoriteEntity.SetUpdateTime(now);
            newFavoriteEntity.SetDeleted(Boolean.FALSE);
            favoriteMapper.InsertFavorite(newFavoriteEntity);
            favorited = true;
        } else {
            boolean nextCanceled = !Boolean.TRUE.equals(favoriteEntity.GetCanceled());
            favoriteEntity.SetCanceled(nextCanceled);
            favoriteEntity.SetUpdateTime(now);
            favoriteEntity.SetDeleted(Boolean.FALSE);
            favoriteMapper.UpdateFavorite(favoriteEntity);
            favorited = !nextCanceled;
        }
        Long favoriteCount = favoriteMapper.CountActiveByResourceId(productId);
        return BuildResponse(productId, favorited, favoriteCount);
    }

    /**
     * 校验登录态
     */
    private void ValidateCurrentUser(Long currentUserId) {
        if (currentUserId == null) {
            throw new BusinessException(BizCodeEnum.UNAUTHORIZED, "请先登录后再收藏");
        }
    }

    /**
     * 校验商品存在
     */
    private void ValidateProduct(Long productId) {
        ProductEntity productEntity = productMapper.FindProductById(productId);
        if (productEntity == null || Boolean.TRUE.equals(productEntity.GetDeleted())) {
            throw new BusinessException(BizCodeEnum.PRODUCT_NOT_FOUND, "商品不存在");
        }
    }

    /**
     * 构建响应
     */
    private ProductFavoriteResponseDto BuildResponse(Long productId, boolean favorited, Long favoriteCount) {
        ProductFavoriteResponseDto responseDto = new ProductFavoriteResponseDto();
        responseDto.SetProductId(productId);
        responseDto.SetFavorited(favorited);
        responseDto.SetFavoriteCount(favoriteCount == null ? 0L : favoriteCount);
        return responseDto;
    }
}
