package com.xialuo.campusshare.module.resource.service.impl;

import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.entity.ProductEntity;
import com.xialuo.campusshare.entity.UserEntity;
import com.xialuo.campusshare.enums.ProductStatusEnum;
import com.xialuo.campusshare.module.resource.dto.ProductDetailResponseDto;
import com.xialuo.campusshare.module.resource.dto.PublishProductRequestDto;
import com.xialuo.campusshare.module.resource.mapper.ProductMapper;
import com.xialuo.campusshare.module.resource.service.ProductPublishService;
import com.xialuo.campusshare.module.user.mapper.UserMapper;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 商品发布服务实现
 */
@Service
public class ProductPublishServiceImpl implements ProductPublishService {
    /** 商品Mapper */
    private final ProductMapper productMapper;
    /** 用户Mapper */
    private final UserMapper userMapper;

    public ProductPublishServiceImpl(ProductMapper productMapper, UserMapper userMapper) {
        this.productMapper = productMapper;
        this.userMapper = userMapper;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ProductDetailResponseDto PublishProduct(PublishProductRequestDto requestDto, Long currentUserId) {
        ProductEntity productEntity = BuildProductEntity(requestDto, currentUserId);
        Integer countRows = productMapper.InsertProduct(productEntity);
        if (countRows == null || countRows <= 0 || productEntity.GetProductId() == null) {
            throw new BusinessException(BizCodeEnum.SYSTEM_ERROR, "商品发布失败");
        }

        ProductEntity latestProductEntity = productMapper.FindProductById(productEntity.GetProductId());
        if (latestProductEntity == null) {
            throw new BusinessException(BizCodeEnum.PRODUCT_NOT_FOUND, "商品不存在");
        }
        return BuildProductDetailResponse(latestProductEntity);
    }

    /**
     * 构建商品实体
     */
    private ProductEntity BuildProductEntity(PublishProductRequestDto requestDto, Long currentUserId) {
        ProductEntity productEntity = new ProductEntity();
        productEntity.SetResourceId(null);
        productEntity.SetTitle(NormalizeText(requestDto.GetTitle()));
        productEntity.SetCategory(NormalizeText(requestDto.GetCategory()));
        productEntity.SetConditionLevel(NormalizeText(requestDto.GetConditionLevel()));
        productEntity.SetPrice(requestDto.GetPrice());
        productEntity.SetTradeLocation(NormalizeText(requestDto.GetTradeLocation()));
        productEntity.SetDescription(NormalizeText(requestDto.GetDescription()));
        productEntity.SetImageFileIds(JoinImageFileIds(requestDto.GetImageFileIds()));
        productEntity.SetSellerUserId(currentUserId);
        productEntity.SetProductStatus(ProductStatusEnum.PUBLISHED);
        productEntity.SetOnShelf(Boolean.TRUE);
        productEntity.SetStockCount(1);
        productEntity.SetHasEffectiveOrder(Boolean.FALSE);
        productEntity.SetCreateTime(LocalDateTime.now());
        productEntity.SetUpdateTime(LocalDateTime.now());
        productEntity.SetDeleted(Boolean.FALSE);
        return productEntity;
    }

    /**
     * 构建详情响应
     */
    private ProductDetailResponseDto BuildProductDetailResponse(ProductEntity productEntity) {
        ProductDetailResponseDto responseDto = new ProductDetailResponseDto();
        responseDto.SetProductId(productEntity.GetProductId());
        responseDto.SetTitle(ResolveTitle(productEntity));
        responseDto.SetCategory(productEntity.GetCategory());
        responseDto.SetConditionLevel(productEntity.GetConditionLevel());
        responseDto.SetPrice(productEntity.GetPrice());
        responseDto.SetTradeLocation(productEntity.GetTradeLocation());
        responseDto.SetSellerUserId(productEntity.GetSellerUserId());
        responseDto.SetSellerDisplayName(ResolveSellerDisplayName(productEntity.GetSellerUserId()));
        responseDto.SetProductStatus(productEntity.GetProductStatus());
        responseDto.SetDescription(ResolveDescription(productEntity));
        responseDto.SetImageFileIds(SplitImageFileIds(productEntity.GetImageFileIds()));
        responseDto.SetOnShelf(productEntity.GetOnShelf());
        responseDto.SetStockCount(productEntity.GetStockCount());
        responseDto.SetCreateTime(productEntity.GetCreateTime());
        return responseDto;
    }

    /**
     * 解析标题
     */
    private String ResolveTitle(ProductEntity productEntity) {
        String title = NormalizeText(productEntity.GetTitle());
        if (!title.isBlank()) {
            return title;
        }
        String category = NormalizeText(productEntity.GetCategory());
        if (!category.isBlank()) {
            return category + " #" + productEntity.GetProductId();
        }
        return "校园商品 #" + productEntity.GetProductId();
    }

    /**
     * 解析描述
     */
    private String ResolveDescription(ProductEntity productEntity) {
        String description = NormalizeText(productEntity.GetDescription());
        if (!description.isBlank()) {
            return description;
        }
        return "分类：" + NullToDash(productEntity.GetCategory())
            + "，成色：" + NullToDash(productEntity.GetConditionLevel())
            + "，交易地点：" + NullToDash(productEntity.GetTradeLocation())
            + "。";
    }

    /**
     * 获取卖家昵称
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
     * 拼接图片ID
     */
    private String JoinImageFileIds(List<String> imageFileIdList) {
        if (imageFileIdList == null || imageFileIdList.isEmpty()) {
            return "";
        }
        return imageFileIdList.stream()
            .map(this::NormalizeText)
            .filter(imageFileId -> !imageFileId.isBlank())
            .distinct()
            .reduce((left, right) -> left + "," + right)
            .orElse("");
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
     * 文本规范化
     */
    private String NormalizeText(String text) {
        return text == null ? "" : text.trim();
    }

    /**
     * 空值转横线
     */
    private String NullToDash(String text) {
        String normalizedText = NormalizeText(text);
        if (normalizedText.isBlank()) {
            return "-";
        }
        return normalizedText;
    }
}

