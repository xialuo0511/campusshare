package com.xialuo.campusshare.module.resource.service.impl;

import com.xialuo.campusshare.common.api.PageQuery;
import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.entity.CommentEntity;
import com.xialuo.campusshare.entity.ProductEntity;
import com.xialuo.campusshare.entity.UserEntity;
import com.xialuo.campusshare.module.resource.dto.CreateProductCommentRequestDto;
import com.xialuo.campusshare.module.resource.dto.ProductCommentListResponseDto;
import com.xialuo.campusshare.module.resource.dto.ProductCommentResponseDto;
import com.xialuo.campusshare.module.resource.mapper.ProductCommentMapper;
import com.xialuo.campusshare.module.resource.mapper.ProductMapper;
import com.xialuo.campusshare.module.resource.service.ProductCommentService;
import com.xialuo.campusshare.module.user.mapper.UserMapper;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 商品评论服务实现
 */
@Service
public class ProductCommentServiceImpl implements ProductCommentService {
    /** 商品评论Mapper */
    private final ProductCommentMapper productCommentMapper;
    /** 商品Mapper */
    private final ProductMapper productMapper;
    /** 用户Mapper */
    private final UserMapper userMapper;

    public ProductCommentServiceImpl(
        ProductCommentMapper productCommentMapper,
        ProductMapper productMapper,
        UserMapper userMapper
    ) {
        this.productCommentMapper = productCommentMapper;
        this.productMapper = productMapper;
        this.userMapper = userMapper;
    }

    @Override
    public ProductCommentListResponseDto ListProductComments(Long productId, Integer pageNo, Integer pageSize) {
        ProductEntity productEntity = GetReadableProduct(productId);
        Integer resolvedPageNo = ResolvePageNo(pageNo);
        Integer resolvedPageSize = ResolvePageSize(pageSize);
        Integer offset = (resolvedPageNo - 1) * resolvedPageSize;

        List<ProductCommentResponseDto> commentResponseList = productCommentMapper.ListCommentsByProductId(
            productEntity.GetProductId(),
            offset,
            resolvedPageSize
        ).stream().map(this::BuildCommentResponse).toList();
        Long totalCount = productCommentMapper.CountCommentsByProductId(productEntity.GetProductId());
        BigDecimal averageScore = productCommentMapper.AverageScoreByProductId(productEntity.GetProductId());

        ProductCommentListResponseDto responseDto = new ProductCommentListResponseDto();
        responseDto.SetPageNo(resolvedPageNo);
        responseDto.SetPageSize(resolvedPageSize);
        responseDto.SetTotalCount(totalCount == null ? 0L : totalCount);
        responseDto.SetAverageScore(averageScore == null ? BigDecimal.ZERO : averageScore);
        responseDto.SetCommentList(commentResponseList);
        return responseDto;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ProductCommentResponseDto CreateProductComment(
        Long productId,
        CreateProductCommentRequestDto requestDto,
        Long currentUserId
    ) {
        ProductEntity productEntity = GetReadableProduct(productId);
        if (currentUserId.equals(productEntity.GetSellerUserId())) {
            throw new BusinessException(BizCodeEnum.BUSINESS_CONFLICT, "卖家不能评论自己的商品");
        }

        CommentEntity commentEntity = new CommentEntity();
        commentEntity.SetResourceId(productEntity.GetProductId());
        commentEntity.SetFromUserId(currentUserId);
        commentEntity.SetToUserId(ResolveToUserId(requestDto, productEntity));
        commentEntity.SetScore(requestDto.GetScore());
        commentEntity.SetContent(NormalizeText(requestDto.GetContent()));
        commentEntity.SetHiddenFlag(Boolean.FALSE);
        commentEntity.SetCreateTime(LocalDateTime.now());
        commentEntity.SetUpdateTime(LocalDateTime.now());
        commentEntity.SetDeleted(Boolean.FALSE);

        Integer countRows = productCommentMapper.InsertComment(commentEntity);
        if (countRows == null || countRows <= 0 || commentEntity.GetCommentId() == null) {
            throw new BusinessException(BizCodeEnum.SYSTEM_ERROR, "评论提交失败");
        }
        return BuildCommentResponse(commentEntity);
    }

    /**
     * 查询可读商品
     */
    private ProductEntity GetReadableProduct(Long productId) {
        ProductEntity productEntity = productMapper.FindProductById(productId);
        if (productEntity == null || !Boolean.TRUE.equals(productEntity.GetOnShelf())) {
            throw new BusinessException(BizCodeEnum.PRODUCT_NOT_FOUND, "商品不存在");
        }
        return productEntity;
    }

    /**
     * 解析被评论用户ID
     */
    private Long ResolveToUserId(CreateProductCommentRequestDto requestDto, ProductEntity productEntity) {
        if (requestDto.GetToUserId() != null) {
            UserEntity toUserEntity = userMapper.FindUserById(requestDto.GetToUserId());
            if (toUserEntity == null) {
                throw new BusinessException(BizCodeEnum.USER_NOT_FOUND, "被评论用户不存在");
            }
            return requestDto.GetToUserId();
        }
        return productEntity.GetSellerUserId();
    }

    /**
     * 构建评论响应
     */
    private ProductCommentResponseDto BuildCommentResponse(CommentEntity commentEntity) {
        ProductCommentResponseDto responseDto = new ProductCommentResponseDto();
        responseDto.SetCommentId(commentEntity.GetCommentId());
        responseDto.SetProductId(commentEntity.GetResourceId());
        responseDto.SetFromUserId(commentEntity.GetFromUserId());
        responseDto.SetFromUserDisplayName(ResolveUserDisplayName(commentEntity.GetFromUserId()));
        responseDto.SetToUserId(commentEntity.GetToUserId());
        responseDto.SetToUserDisplayName(ResolveUserDisplayName(commentEntity.GetToUserId()));
        responseDto.SetScore(commentEntity.GetScore());
        responseDto.SetContent(commentEntity.GetContent());
        responseDto.SetCreateTime(commentEntity.GetCreateTime());
        return responseDto;
    }

    /**
     * 获取用户昵称
     */
    private String ResolveUserDisplayName(Long userId) {
        if (userId == null || userId <= 0L) {
            return "";
        }
        UserEntity userEntity = userMapper.FindUserById(userId);
        if (userEntity == null || userEntity.GetDisplayName() == null || userEntity.GetDisplayName().isBlank()) {
            return "用户#" + userId;
        }
        return userEntity.GetDisplayName().trim();
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
     * 文本规范化
     */
    private String NormalizeText(String text) {
        return text == null ? "" : text.trim();
    }
}
