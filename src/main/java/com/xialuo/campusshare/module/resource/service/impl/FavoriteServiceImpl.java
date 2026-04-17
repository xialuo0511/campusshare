package com.xialuo.campusshare.module.resource.service.impl;

import com.xialuo.campusshare.common.api.PageQuery;
import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.entity.FavoriteEntity;
import com.xialuo.campusshare.entity.ProductEntity;
import com.xialuo.campusshare.entity.StudyMaterialEntity;
import com.xialuo.campusshare.entity.UserEntity;
import com.xialuo.campusshare.enums.ResourceTypeEnum;
import com.xialuo.campusshare.module.material.dto.MaterialFavoriteResponseDto;
import com.xialuo.campusshare.module.material.dto.MaterialListResponseDto;
import com.xialuo.campusshare.module.material.dto.MaterialResponseDto;
import com.xialuo.campusshare.module.material.mapper.StudyMaterialMapper;
import com.xialuo.campusshare.module.resource.dto.ProductFavoriteResponseDto;
import com.xialuo.campusshare.module.resource.dto.ProductListResponseDto;
import com.xialuo.campusshare.module.resource.dto.ProductSummaryResponseDto;
import com.xialuo.campusshare.module.resource.mapper.FavoriteMapper;
import com.xialuo.campusshare.module.resource.mapper.ProductMapper;
import com.xialuo.campusshare.module.resource.service.FavoriteService;
import com.xialuo.campusshare.module.user.mapper.UserMapper;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
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
    /** 用户Mapper */
    private final UserMapper userMapper;

    public FavoriteServiceImpl(
        FavoriteMapper favoriteMapper,
        ProductMapper productMapper,
        StudyMaterialMapper studyMaterialMapper,
        UserMapper userMapper
    ) {
        this.favoriteMapper = favoriteMapper;
        this.productMapper = productMapper;
        this.studyMaterialMapper = studyMaterialMapper;
        this.userMapper = userMapper;
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

    @Override
    public ProductListResponseDto ListMyProductFavorites(Long currentUserId, Integer pageNo, Integer pageSize) {
        ValidateCurrentUser(currentUserId);
        Integer resolvedPageNo = ResolvePageNo(pageNo);
        Integer resolvedPageSize = ResolvePageSize(pageSize);
        Integer offset = (resolvedPageNo - 1) * resolvedPageSize;

        List<Long> resourceIdList = favoriteMapper.ListActiveResourceIdsByUserAndType(
            currentUserId,
            ResourceTypeEnum.PRODUCT,
            offset,
            resolvedPageSize
        );
        List<ProductSummaryResponseDto> productSummaryList = new ArrayList<>();
        if (resourceIdList != null) {
            for (Long resourceId : resourceIdList) {
                ProductEntity productEntity = productMapper.FindProductById(resourceId);
                if (productEntity == null || Boolean.TRUE.equals(productEntity.GetDeleted())) {
                    continue;
                }
                productSummaryList.add(BuildProductSummaryResponse(productEntity));
            }
        }

        ProductListResponseDto responseDto = new ProductListResponseDto();
        responseDto.SetPageNo(resolvedPageNo);
        responseDto.SetPageSize(resolvedPageSize);
        responseDto.SetTotalCount(favoriteMapper.CountActiveByUserAndType(currentUserId, ResourceTypeEnum.PRODUCT));
        responseDto.SetProductList(productSummaryList);
        return responseDto;
    }

    @Override
    public MaterialListResponseDto ListMyMaterialFavorites(Long currentUserId, Integer pageNo, Integer pageSize) {
        ValidateCurrentUser(currentUserId);
        Integer resolvedPageNo = ResolvePageNo(pageNo);
        Integer resolvedPageSize = ResolvePageSize(pageSize);
        Integer offset = (resolvedPageNo - 1) * resolvedPageSize;

        List<Long> resourceIdList = favoriteMapper.ListActiveResourceIdsByUserAndType(
            currentUserId,
            ResourceTypeEnum.STUDY_MATERIAL,
            offset,
            resolvedPageSize
        );
        List<MaterialResponseDto> materialResponseList = new ArrayList<>();
        if (resourceIdList != null) {
            for (Long resourceId : resourceIdList) {
                StudyMaterialEntity materialEntity = studyMaterialMapper.FindMaterialById(resourceId);
                if (materialEntity == null || Boolean.TRUE.equals(materialEntity.GetDeleted())) {
                    continue;
                }
                materialResponseList.add(BuildMaterialDetailResponse(materialEntity));
            }
        }

        MaterialListResponseDto responseDto = new MaterialListResponseDto();
        responseDto.SetPageNo(resolvedPageNo);
        responseDto.SetPageSize(resolvedPageSize);
        responseDto.SetTotalCount(
            favoriteMapper.CountActiveByUserAndType(currentUserId, ResourceTypeEnum.STUDY_MATERIAL)
        );
        responseDto.SetMaterialList(materialResponseList);
        return responseDto;
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

    /**
     * 构建商品摘要响应
     */
    private ProductSummaryResponseDto BuildProductSummaryResponse(ProductEntity productEntity) {
        ProductSummaryResponseDto responseDto = new ProductSummaryResponseDto();
        responseDto.SetProductId(productEntity.GetProductId());
        responseDto.SetTitle(BuildProductTitle(productEntity));
        responseDto.SetCategory(productEntity.GetCategory());
        responseDto.SetConditionLevel(productEntity.GetConditionLevel());
        responseDto.SetPrice(productEntity.GetPrice());
        responseDto.SetTradeLocation(productEntity.GetTradeLocation());
        responseDto.SetSellerUserId(productEntity.GetSellerUserId());
        responseDto.SetSellerDisplayName(ResolveSellerDisplayName(productEntity.GetSellerUserId()));
        responseDto.SetImageFileIds(SplitImageFileIds(productEntity.GetImageFileIds()));
        responseDto.SetProductStatus(productEntity.GetProductStatus());
        responseDto.SetCreateTime(productEntity.GetCreateTime());
        return responseDto;
    }

    /**
     * 构建资料详情响应
     */
    private MaterialResponseDto BuildMaterialDetailResponse(StudyMaterialEntity materialEntity) {
        MaterialResponseDto responseDto = new MaterialResponseDto();
        responseDto.SetMaterialId(materialEntity.GetMaterialId());
        responseDto.SetUploaderUserId(materialEntity.GetUploaderUserId());
        responseDto.SetCourseName(materialEntity.GetCourseName());
        responseDto.SetTags(SplitTags(materialEntity.GetTags()));
        responseDto.SetDescription(materialEntity.GetDescription());
        responseDto.SetFileId(materialEntity.GetFileId());
        responseDto.SetFileType(materialEntity.GetFileType());
        responseDto.SetFileSizeBytes(materialEntity.GetFileSizeBytes());
        responseDto.SetMaterialStatus(materialEntity.GetMaterialStatus());
        responseDto.SetDownloadCostPoints(materialEntity.GetDownloadCostPoints());
        responseDto.SetCopyrightDeclared(materialEntity.GetCopyrightDeclared());
        responseDto.SetDownloadCount(materialEntity.GetDownloadCount());
        responseDto.SetReviewRemark(materialEntity.GetReviewRemark());
        responseDto.SetLastReviewTime(materialEntity.GetLastReviewTime());
        responseDto.SetCreateTime(materialEntity.GetCreateTime());
        return responseDto;
    }

    /**
     * 构建商品标题
     */
    private String BuildProductTitle(ProductEntity productEntity) {
        String title = NormalizeText(productEntity.GetTitle());
        if (!title.isBlank()) {
            return title;
        }
        String category = NormalizeText(productEntity.GetCategory());
        if (category.isBlank()) {
            category = "校园商品";
        }
        return category + " #" + productEntity.GetProductId();
    }

    /**
     * 获取卖家名称
     */
    private String ResolveSellerDisplayName(Long sellerUserId) {
        if (sellerUserId == null) {
            return "匿名用户";
        }
        UserEntity sellerEntity = userMapper.FindUserById(sellerUserId);
        if (sellerEntity == null || sellerEntity.GetDisplayName() == null || sellerEntity.GetDisplayName().isBlank()) {
            return "用户#" + sellerUserId;
        }
        return sellerEntity.GetDisplayName().trim();
    }

    /**
     * 拆分图片ID
     */
    private List<String> SplitImageFileIds(String imageFileIds) {
        if (imageFileIds == null || imageFileIds.isBlank()) {
            return List.of();
        }
        return Arrays.stream(imageFileIds.split(","))
            .map(this::NormalizeText)
            .filter(imageFileId -> !imageFileId.isBlank())
            .distinct()
            .toList();
    }

    /**
     * 拆分标签
     */
    private List<String> SplitTags(String tagsText) {
        if (tagsText == null || tagsText.isBlank()) {
            return new ArrayList<>();
        }
        return Arrays.stream(tagsText.split(","))
            .map(String::trim)
            .filter(item -> !item.isBlank())
            .distinct()
            .toList();
    }

    /**
     * 解析页码
     */
    private Integer ResolvePageNo(Integer pageNo) {
        if (pageNo == null || pageNo < 1) {
            return PageQuery.DEFAULT_PAGE_NO;
        }
        return pageNo;
    }

    /**
     * 解析页大小
     */
    private Integer ResolvePageSize(Integer pageSize) {
        if (pageSize == null || pageSize < 1) {
            return PageQuery.DEFAULT_PAGE_SIZE;
        }
        if (pageSize > PageQuery.MAX_PAGE_SIZE) {
            return PageQuery.MAX_PAGE_SIZE;
        }
        return pageSize;
    }

    /**
     * 规范化文本
     */
    private String NormalizeText(String text) {
        return text == null ? "" : text.trim();
    }
}
