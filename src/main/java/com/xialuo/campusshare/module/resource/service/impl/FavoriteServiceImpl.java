package com.xialuo.campusshare.module.resource.service.impl;

import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.entity.FavoriteEntity;
import com.xialuo.campusshare.entity.ProductEntity;
import com.xialuo.campusshare.entity.StudyMaterialEntity;
import com.xialuo.campusshare.enums.ResourceTypeEnum;
import com.xialuo.campusshare.module.material.dto.MaterialFavoriteResponseDto;
import com.xialuo.campusshare.module.material.mapper.StudyMaterialMapper;
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
    /** 资料Mapper */
    private final StudyMaterialMapper studyMaterialMapper;

    public FavoriteServiceImpl(
        FavoriteMapper favoriteMapper,
        ProductMapper productMapper,
        StudyMaterialMapper studyMaterialMapper
    ) {
        this.favoriteMapper = favoriteMapper;
        this.productMapper = productMapper;
        this.studyMaterialMapper = studyMaterialMapper;
    }

    @Override
    public ProductFavoriteResponseDto GetProductFavoriteState(Long productId, Long currentUserId) {
        ValidateCurrentUser(currentUserId);
        ValidateProduct(productId);
        FavoriteEntity favoriteEntity = favoriteMapper.FindByUserIdAndResourceIdAndType(
            currentUserId,
            productId,
            ResourceTypeEnum.PRODUCT
        );
        boolean favorited = favoriteEntity != null && !Boolean.TRUE.equals(favoriteEntity.GetCanceled());
        Long favoriteCount = favoriteMapper.CountActiveByResourceIdAndType(productId, ResourceTypeEnum.PRODUCT);
        return BuildResponse(productId, favorited, favoriteCount);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ProductFavoriteResponseDto ToggleProductFavorite(Long productId, Long currentUserId) {
        ValidateCurrentUser(currentUserId);
        ValidateProduct(productId);

        FavoriteEntity favoriteEntity = favoriteMapper.FindByUserIdAndResourceIdAndType(
            currentUserId,
            productId,
            ResourceTypeEnum.PRODUCT
        );
        LocalDateTime now = LocalDateTime.now();
        boolean favorited;
        if (favoriteEntity == null) {
            FavoriteEntity newFavoriteEntity = new FavoriteEntity();
            newFavoriteEntity.SetUserId(currentUserId);
            newFavoriteEntity.SetResourceId(productId);
            newFavoriteEntity.SetResourceType(ResourceTypeEnum.PRODUCT);
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
        Long favoriteCount = favoriteMapper.CountActiveByResourceIdAndType(productId, ResourceTypeEnum.PRODUCT);
        return BuildResponse(productId, favorited, favoriteCount);
    }

    @Override
    public MaterialFavoriteResponseDto GetMaterialFavoriteState(Long materialId, Long currentUserId) {
        ValidateCurrentUser(currentUserId);
        ValidateMaterial(materialId);
        FavoriteEntity favoriteEntity = favoriteMapper.FindByUserIdAndResourceIdAndType(
            currentUserId,
            materialId,
            ResourceTypeEnum.STUDY_MATERIAL
        );
        boolean favorited = favoriteEntity != null && !Boolean.TRUE.equals(favoriteEntity.GetCanceled());
        Long favoriteCount = favoriteMapper.CountActiveByResourceIdAndType(materialId, ResourceTypeEnum.STUDY_MATERIAL);
        return BuildMaterialResponse(materialId, favorited, favoriteCount);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MaterialFavoriteResponseDto ToggleMaterialFavorite(Long materialId, Long currentUserId) {
        ValidateCurrentUser(currentUserId);
        ValidateMaterial(materialId);

        FavoriteEntity favoriteEntity = favoriteMapper.FindByUserIdAndResourceIdAndType(
            currentUserId,
            materialId,
            ResourceTypeEnum.STUDY_MATERIAL
        );
        LocalDateTime now = LocalDateTime.now();
        boolean favorited;
        if (favoriteEntity == null) {
            FavoriteEntity newFavoriteEntity = new FavoriteEntity();
            newFavoriteEntity.SetUserId(currentUserId);
            newFavoriteEntity.SetResourceId(materialId);
            newFavoriteEntity.SetResourceType(ResourceTypeEnum.STUDY_MATERIAL);
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
        Long favoriteCount = favoriteMapper.CountActiveByResourceIdAndType(materialId, ResourceTypeEnum.STUDY_MATERIAL);
        return BuildMaterialResponse(materialId, favorited, favoriteCount);
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
     * 校验资料存在
     */
    private void ValidateMaterial(Long materialId) {
        StudyMaterialEntity materialEntity = studyMaterialMapper.FindMaterialById(materialId);
        if (materialEntity == null || Boolean.TRUE.equals(materialEntity.GetDeleted())) {
            throw new BusinessException(BizCodeEnum.MATERIAL_NOT_FOUND, "资料不存在");
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

    /**
     * 构建资料收藏响应
     */
    private MaterialFavoriteResponseDto BuildMaterialResponse(Long materialId, boolean favorited, Long favoriteCount) {
        MaterialFavoriteResponseDto responseDto = new MaterialFavoriteResponseDto();
        responseDto.SetMaterialId(materialId);
        responseDto.SetFavorited(favorited);
        responseDto.SetFavoriteCount(favoriteCount == null ? 0L : favoriteCount);
        return responseDto;
    }
}
