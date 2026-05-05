package com.xialuo.campusshare.module.resource.mapper;

import com.xialuo.campusshare.entity.ProductEntity;
import com.xialuo.campusshare.enums.ProductStatusEnum;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 商品数据映射接口
 */
@Mapper
public interface ProductMapper {
    /**
     * 新增商品
     */
    Integer InsertProduct(ProductEntity productEntity);

    /**
     * 更新商品
     */
    Integer UpdateProduct(ProductEntity productEntity);

    /**
     * 更新商品审核状态
     */
    Integer UpdateProductReviewStatus(
        @Param("productId") Long productId,
        @Param("productStatus") ProductStatusEnum productStatus,
        @Param("onShelf") Boolean onShelf,
        @Param("updateTime") LocalDateTime updateTime
    );

    /**
     * 分页查询已上架商品
     */
    List<ProductEntity> ListPublishedProducts(
        @Param("keyword") String keyword,
        @Param("category") String category,
        @Param("conditionLevel") String conditionLevel,
        @Param("tradeLocation") String tradeLocation,
        @Param("minPrice") BigDecimal minPrice,
        @Param("maxPrice") BigDecimal maxPrice,
        @Param("sortType") String sortType,
        @Param("offset") Integer offset,
        @Param("limit") Integer limit
    );

    /**
     * 统计已上架商品数量
     */
    Long CountPublishedProducts(
        @Param("keyword") String keyword,
        @Param("category") String category,
        @Param("conditionLevel") String conditionLevel,
        @Param("tradeLocation") String tradeLocation,
        @Param("minPrice") BigDecimal minPrice,
        @Param("maxPrice") BigDecimal maxPrice
    );

    /**
     * 缁熻宸插彂甯冨晢鍝佸浘鐗囧紩鐢?
     */
    Long CountPublishedProductImageByFileId(@Param("fileId") String fileId);

    /**
     * 管理后台分页查询商品
     */
    List<ProductEntity> ListProductsForAdmin(
        @Param("keyword") String keyword,
        @Param("category") String category,
        @Param("productStatus") String productStatus,
        @Param("sellerUserId") Long sellerUserId,
        @Param("offset") Integer offset,
        @Param("limit") Integer limit
    );

    /**
     * 管理后台统计商品数量
     */
    Long CountProductsForAdmin(
        @Param("keyword") String keyword,
        @Param("category") String category,
        @Param("productStatus") String productStatus,
        @Param("sellerUserId") Long sellerUserId
    );

    /**
     * 分页查询卖家商品
     */
    List<ProductEntity> ListProductsBySeller(
        @Param("sellerUserId") Long sellerUserId,
        @Param("productStatus") String productStatus,
        @Param("offset") Integer offset,
        @Param("limit") Integer limit
    );

    /**
     * 统计卖家商品数量
     */
    Long CountProductsBySeller(
        @Param("sellerUserId") Long sellerUserId,
        @Param("productStatus") String productStatus
    );

    /**
     * 按ID查询商品
     */
    ProductEntity FindProductById(@Param("productId") Long productId);

    /**
     * 下架商品
     */
    Integer OfflineProduct(
        @Param("productId") Long productId,
        @Param("updateTime") LocalDateTime updateTime
    );

    /**
     * 强制下架商品
     */
    Integer ForceOfflineProduct(
        @Param("productId") Long productId,
        @Param("updateTime") LocalDateTime updateTime
    );

    /**
     * 锁定商品
     */
    Integer LockProductForOrder(@Param("productId") Long productId, @Param("updateTime") LocalDateTime updateTime);

    /**
     * 释放商品锁定
     */
    Integer ReleaseProductOrderLock(@Param("productId") Long productId, @Param("updateTime") LocalDateTime updateTime);

    /**
     * 完成订单后关闭商品
     */
    Integer FinalizeProductOrderSuccess(
        @Param("productId") Long productId,
        @Param("updateTime") LocalDateTime updateTime
    );
}
