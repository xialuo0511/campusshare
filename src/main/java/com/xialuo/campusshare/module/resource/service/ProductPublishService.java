package com.xialuo.campusshare.module.resource.service;

import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.module.resource.dto.ProductDetailResponseDto;
import com.xialuo.campusshare.module.resource.dto.ProductReviewRequestDto;
import com.xialuo.campusshare.module.resource.dto.PublishProductRequestDto;

/**
 * 商品发布服务接口
 */
public interface ProductPublishService {
    /**
     * 发布商品
     */
    ProductDetailResponseDto PublishProduct(PublishProductRequestDto requestDto, Long currentUserId);

    /**
     * 更新商品
     */
    ProductDetailResponseDto UpdateProduct(
        Long productId,
        PublishProductRequestDto requestDto,
        Long currentUserId,
        UserRoleEnum currentUserRole
    );

    /**
     * 下架商品
     */
    ProductDetailResponseDto OfflineProduct(
        Long productId,
        Long currentUserId,
        UserRoleEnum currentUserRole,
        String offlineRemark
    );

    /**
     * 管理员强制下架商品
     */
    ProductDetailResponseDto ForceOfflineProductByAdmin(
        Long productId,
        Long adminUserId,
        String offlineRemark
    );

    /**
     * 管理员审核商品
     */
    ProductDetailResponseDto ReviewProductByAdmin(
        Long productId,
        ProductReviewRequestDto requestDto,
        Long adminUserId
    );
}
