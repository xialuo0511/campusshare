package com.xialuo.campusshare.module.resource.service;

import com.xialuo.campusshare.module.resource.dto.CreateProductCommentRequestDto;
import com.xialuo.campusshare.module.resource.dto.ProductCommentListResponseDto;
import com.xialuo.campusshare.module.resource.dto.ProductCommentResponseDto;

/**
 * 商品评论服务接口
 */
public interface ProductCommentService {
    /**
     * 分页查询评论
     */
    ProductCommentListResponseDto ListProductComments(Long productId, Integer pageNo, Integer pageSize);

    /**
     * 新增评论
     */
    ProductCommentResponseDto CreateProductComment(
        Long productId,
        CreateProductCommentRequestDto requestDto,
        Long currentUserId
    );
}

