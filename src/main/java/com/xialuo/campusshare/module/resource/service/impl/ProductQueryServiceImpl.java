package com.xialuo.campusshare.module.resource.service.impl;

import com.xialuo.campusshare.common.api.PageQuery;
import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.entity.ProductEntity;
import com.xialuo.campusshare.entity.UserEntity;
import com.xialuo.campusshare.enums.ProductStatusEnum;
import com.xialuo.campusshare.module.resource.dto.ProductDetailResponseDto;
import com.xialuo.campusshare.module.resource.dto.ProductListResponseDto;
import com.xialuo.campusshare.module.resource.dto.ProductSummaryResponseDto;
import com.xialuo.campusshare.module.resource.mapper.ProductMapper;
import com.xialuo.campusshare.module.resource.service.ProductQueryService;
import com.xialuo.campusshare.module.user.mapper.UserMapper;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

/**
 * 商品查询服务实现
 */
@Service
public class ProductQueryServiceImpl implements ProductQueryService {
    /** 排序类型-最新 */
    private static final String SORT_TYPE_NEWEST = "NEWEST";
    /** 排序类型-价格升序 */
    private static final String SORT_TYPE_PRICE_ASC = "PRICE_ASC";
    /** 排序类型-价格降序 */
    private static final String SORT_TYPE_PRICE_DESC = "PRICE_DESC";

    /** 商品Mapper */
    private final ProductMapper productMapper;
    /** 用户Mapper */
    private final UserMapper userMapper;

    public ProductQueryServiceImpl(ProductMapper productMapper, UserMapper userMapper) {
        this.productMapper = productMapper;
        this.userMapper = userMapper;
    }

    @Override
    public ProductListResponseDto ListProducts(
        Integer pageNo,
        Integer pageSize,
        String keyword,
        String category,
        String conditionLevel,
        String tradeLocation,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        String sortType
    ) {
        Integer resolvedPageNo = ResolvePageNo(pageNo);
        Integer resolvedPageSize = ResolvePageSize(pageSize);
        String resolvedKeyword = NormalizeText(keyword);
        String resolvedCategory = NormalizeText(category);
        String resolvedConditionLevel = NormalizeText(conditionLevel);
        String resolvedTradeLocation = NormalizeText(tradeLocation);
        String resolvedSortType = ResolveSortType(sortType);

        Integer offset = (resolvedPageNo - 1) * resolvedPageSize;
        List<ProductSummaryResponseDto> productResponseList = productMapper.ListPublishedProducts(
            resolvedKeyword,
            resolvedCategory,
            resolvedConditionLevel,
            resolvedTradeLocation,
            minPrice,
            maxPrice,
            resolvedSortType,
            offset,
            resolvedPageSize
        ).stream().map(this::BuildProductSummaryResponse).toList();
        Long totalCount = productMapper.CountPublishedProducts(
            resolvedKeyword,
            resolvedCategory,
            resolvedConditionLevel,
            resolvedTradeLocation,
            minPrice,
            maxPrice
        );

        ProductListResponseDto responseDto = new ProductListResponseDto();
        responseDto.SetPageNo(resolvedPageNo);
        responseDto.SetPageSize(resolvedPageSize);
        responseDto.SetTotalCount(totalCount == null ? 0L : totalCount);
        responseDto.SetProductList(productResponseList);
        return responseDto;
    }

    @Override
    public ProductListResponseDto ListMyProducts(
        Long currentUserId,
        Integer pageNo,
        Integer pageSize,
        String productStatus
    ) {
        Integer resolvedPageNo = ResolvePageNo(pageNo);
        Integer resolvedPageSize = ResolvePageSize(pageSize);
        String resolvedProductStatus = ResolveProductStatus(productStatus);
        Integer offset = (resolvedPageNo - 1) * resolvedPageSize;

        List<ProductSummaryResponseDto> productResponseList = productMapper.ListProductsBySeller(
            currentUserId,
            resolvedProductStatus,
            offset,
            resolvedPageSize
        ).stream().map(this::BuildProductSummaryResponse).toList();

        Long totalCount = productMapper.CountProductsBySeller(currentUserId, resolvedProductStatus);

        ProductListResponseDto responseDto = new ProductListResponseDto();
        responseDto.SetPageNo(resolvedPageNo);
        responseDto.SetPageSize(resolvedPageSize);
        responseDto.SetTotalCount(totalCount == null ? 0L : totalCount);
        responseDto.SetProductList(productResponseList);
        return responseDto;
    }

    @Override
    public ProductListResponseDto ListProductsForAdmin(
        Integer pageNo,
        Integer pageSize,
        String keyword,
        String category,
        String productStatus,
        Long sellerUserId
    ) {
        Integer resolvedPageNo = ResolvePageNo(pageNo);
        Integer resolvedPageSize = ResolvePageSize(pageSize);
        Integer offset = (resolvedPageNo - 1) * resolvedPageSize;
        String resolvedKeyword = NormalizeText(keyword);
        String resolvedCategory = NormalizeText(category);
        String resolvedProductStatus = ResolveProductStatus(productStatus);

        List<ProductSummaryResponseDto> productResponseList = productMapper.ListProductsForAdmin(
            resolvedKeyword,
            resolvedCategory,
            resolvedProductStatus,
            sellerUserId,
            offset,
            resolvedPageSize
        ).stream().map(this::BuildProductSummaryResponse).toList();
        Long totalCount = productMapper.CountProductsForAdmin(
            resolvedKeyword,
            resolvedCategory,
            resolvedProductStatus,
            sellerUserId
        );

        ProductListResponseDto responseDto = new ProductListResponseDto();
        responseDto.SetPageNo(resolvedPageNo);
        responseDto.SetPageSize(resolvedPageSize);
        responseDto.SetTotalCount(totalCount == null ? 0L : totalCount);
        responseDto.SetProductList(productResponseList);
        return responseDto;
    }

    @Override
    public ProductDetailResponseDto GetProductDetail(Long productId) {
        ProductEntity productEntity = productMapper.FindProductById(productId);
        if (productEntity == null || !Boolean.TRUE.equals(productEntity.GetOnShelf())) {
            throw new BusinessException(BizCodeEnum.PRODUCT_NOT_FOUND, "商品不存在");
        }
        ProductDetailResponseDto responseDto = new ProductDetailResponseDto();
        FillCommonProductFields(responseDto, productEntity);
        responseDto.SetDescription(BuildProductDescription(productEntity));
        responseDto.SetOnShelf(productEntity.GetOnShelf());
        responseDto.SetStockCount(productEntity.GetStockCount());
        return responseDto;
    }

    /**
     * 构建商品摘要响应
     */
    private ProductSummaryResponseDto BuildProductSummaryResponse(ProductEntity productEntity) {
        ProductSummaryResponseDto responseDto = new ProductSummaryResponseDto();
        FillCommonProductFields(responseDto, productEntity);
        return responseDto;
    }

    /**
     * 填充公共字段
     */
    private void FillCommonProductFields(ProductSummaryResponseDto responseDto, ProductEntity productEntity) {
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
     * 构建详情描述
     */
    private String BuildProductDescription(ProductEntity productEntity) {
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
     * 解析排序类型
     */
    private String ResolveSortType(String sortType) {
        String normalizedSortType = NormalizeText(sortType).toUpperCase(Locale.ROOT);
        if (SORT_TYPE_PRICE_ASC.equals(normalizedSortType)) {
            return SORT_TYPE_PRICE_ASC;
        }
        if (SORT_TYPE_PRICE_DESC.equals(normalizedSortType)) {
            return SORT_TYPE_PRICE_DESC;
        }
        return SORT_TYPE_NEWEST;
    }

    /**
     * 解析商品状态
     */
    private String ResolveProductStatus(String productStatus) {
        String normalizedStatus = NormalizeText(productStatus).toUpperCase(Locale.ROOT);
        if (normalizedStatus.isBlank()) {
            return null;
        }
        try {
            return ProductStatusEnum.valueOf(normalizedStatus).name();
        } catch (IllegalArgumentException exception) {
            throw new BusinessException(BizCodeEnum.PARAM_INVALID, "商品状态不合法");
        }
    }

    /**
     * 规范化文本
     */
    private String NormalizeText(String text) {
        return text == null ? "" : text.trim();
    }

    /**
     * 空值转横线
     */
    private String NullToDash(String text) {
        if (text == null || text.isBlank()) {
            return "-";
        }
        return text.trim();
    }
}
