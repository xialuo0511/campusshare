package com.xialuo.campusshare.module.statistics.service.impl;

import com.xialuo.campusshare.entity.ProductEntity;
import com.xialuo.campusshare.entity.StudyMaterialEntity;
import com.xialuo.campusshare.entity.UserEntity;
import com.xialuo.campusshare.module.material.mapper.StudyMaterialMapper;
import com.xialuo.campusshare.module.resource.mapper.ProductMapper;
import com.xialuo.campusshare.module.statistics.dto.MarketOverviewMaterialDto;
import com.xialuo.campusshare.module.statistics.dto.MarketOverviewProductDto;
import com.xialuo.campusshare.module.statistics.dto.MarketOverviewResponseDto;
import com.xialuo.campusshare.module.statistics.service.MarketOverviewService;
import com.xialuo.campusshare.module.user.mapper.UserMapper;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * 市场总览服务实现
 */
@Service
public class MarketOverviewServiceImpl implements MarketOverviewService {
    /** 推荐商品数量 */
    private static final int RECOMMENDED_PRODUCT_LIMIT = 4;
    /** 精选资料数量 */
    private static final int FEATURED_MATERIAL_LIMIT = 3;
    /** 默认排序 */
    private static final String SORT_TYPE_NEWEST = "NEWEST";

    /** 商品Mapper */
    private final ProductMapper productMapper;
    /** 资料Mapper */
    private final StudyMaterialMapper studyMaterialMapper;
    /** 用户Mapper */
    private final UserMapper userMapper;

    public MarketOverviewServiceImpl(
        ProductMapper productMapper,
        StudyMaterialMapper studyMaterialMapper,
        UserMapper userMapper
    ) {
        this.productMapper = productMapper;
        this.studyMaterialMapper = studyMaterialMapper;
        this.userMapper = userMapper;
    }

    @Override
    public MarketOverviewResponseDto GetMarketOverview() {
        List<MarketOverviewProductDto> recommendedProductList = productMapper.ListPublishedProducts(
            "",
            "",
            "",
            "",
            null,
            null,
            SORT_TYPE_NEWEST,
            0,
            RECOMMENDED_PRODUCT_LIMIT
        ).stream().map(this::BuildOverviewProduct).toList();

        List<MarketOverviewMaterialDto> featuredMaterialList = studyMaterialMapper.ListRecentPublishedMaterials(
            FEATURED_MATERIAL_LIMIT
        ).stream().map(this::BuildOverviewMaterial).toList();

        MarketOverviewResponseDto responseDto = new MarketOverviewResponseDto();
        responseDto.SetPublishedProductCount(SafeCount(productMapper.CountPublishedProducts("", "", "", "", null, null)));
        responseDto.SetPublishedMaterialCount(SafeCount(studyMaterialMapper.CountPublishedMaterials()));
        responseDto.SetRecommendedProductList(recommendedProductList);
        responseDto.SetFeaturedMaterialList(featuredMaterialList);
        return responseDto;
    }

    /**
     * 构建总览商品
     */
    private MarketOverviewProductDto BuildOverviewProduct(ProductEntity productEntity) {
        MarketOverviewProductDto responseDto = new MarketOverviewProductDto();
        responseDto.SetProductId(productEntity.GetProductId());
        responseDto.SetTitle(BuildProductTitle(productEntity));
        responseDto.SetConditionLevel(productEntity.GetConditionLevel());
        responseDto.SetPrice(productEntity.GetPrice());
        responseDto.SetTradeLocation(productEntity.GetTradeLocation());
        responseDto.SetSellerDisplayName(ResolveDisplayName(productEntity.GetSellerUserId()));
        responseDto.SetCreateTime(productEntity.GetCreateTime());
        return responseDto;
    }

    /**
     * 构建总览资料
     */
    private MarketOverviewMaterialDto BuildOverviewMaterial(StudyMaterialEntity materialEntity) {
        MarketOverviewMaterialDto responseDto = new MarketOverviewMaterialDto();
        responseDto.SetMaterialId(materialEntity.GetMaterialId());
        responseDto.SetCourseName(materialEntity.GetCourseName());
        responseDto.SetFileType(materialEntity.GetFileType());
        responseDto.SetFileSizeBytes(materialEntity.GetFileSizeBytes());
        responseDto.SetDownloadCount(materialEntity.GetDownloadCount());
        responseDto.SetUploaderDisplayName(ResolveDisplayName(materialEntity.GetUploaderUserId()));
        responseDto.SetCreateTime(materialEntity.GetCreateTime());
        return responseDto;
    }

    /**
     * 构建商品标题
     */
    private String BuildProductTitle(ProductEntity productEntity) {
        String category = productEntity.GetCategory() == null ? "校园商品" : productEntity.GetCategory().trim();
        return category + " #" + productEntity.GetProductId();
    }

    /**
     * 解析昵称
     */
    private String ResolveDisplayName(Long userId) {
        if (userId == null) {
            return "匿名用户";
        }
        UserEntity userEntity = userMapper.FindUserById(userId);
        if (userEntity == null || userEntity.GetDisplayName() == null || userEntity.GetDisplayName().isBlank()) {
            return "用户#" + userId;
        }
        return userEntity.GetDisplayName().trim();
    }

    /**
     * 安全计数
     */
    private Long SafeCount(Long count) {
        return count == null ? 0L : count;
    }
}
