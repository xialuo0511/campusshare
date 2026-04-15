package com.xialuo.campusshare.module.resource.service;

import com.xialuo.campusshare.module.resource.dto.ProductDetailResponseDto;
import com.xialuo.campusshare.module.resource.dto.PublishProductRequestDto;

/**
 * 商品发布服务接口
 */
public interface ProductPublishService {
    /**
     * 发布商品
     */
    ProductDetailResponseDto PublishProduct(PublishProductRequestDto requestDto, Long currentUserId);
}

