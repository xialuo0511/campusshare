package com.xialuo.campusshare.module.resource.service;

import com.xialuo.campusshare.module.resource.dto.ProductDetailResponseDto;
import com.xialuo.campusshare.module.resource.dto.ProductListResponseDto;
import java.math.BigDecimal;

/**
 * 商品查询服务接口
 */
public interface ProductQueryService {
    /**
     * 查询商品列表
     */
    ProductListResponseDto ListProducts(
        Integer pageNo,
        Integer pageSize,
        String keyword,
        String category,
        String conditionLevel,
        String tradeLocation,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        String sortType
    );

    /**
     * 查询商品详情
     */
    ProductDetailResponseDto GetProductDetail(Long productId);
}
