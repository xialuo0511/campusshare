package com.xialuo.campusshare.module.resource.mapper;

import com.xialuo.campusshare.entity.CommentEntity;
import java.math.BigDecimal;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 商品评论数据映射接口
 */
@Mapper
public interface ProductCommentMapper {
    /**
     * 新增评论
     */
    Integer InsertComment(CommentEntity commentEntity);

    /**
     * 分页查询商品评论
     */
    List<CommentEntity> ListCommentsByProductId(
        @Param("productId") Long productId,
        @Param("offset") Integer offset,
        @Param("limit") Integer limit
    );

    /**
     * 统计商品评论数量
     */
    Long CountCommentsByProductId(@Param("productId") Long productId);

    /**
     * 统计商品平均分
     */
    BigDecimal AverageScoreByProductId(@Param("productId") Long productId);

    /**
     * 统计卖家评价数
     */
    Long CountCommentsBySellerUserId(@Param("sellerUserId") Long sellerUserId);

    /**
     * 统计卖家平均分
     */
    BigDecimal AverageScoreBySellerUserId(@Param("sellerUserId") Long sellerUserId);

    /**
     * 统计卖家好评数
     */
    Long CountPositiveCommentsBySellerUserId(
        @Param("sellerUserId") Long sellerUserId,
        @Param("positiveScoreThreshold") Integer positiveScoreThreshold
    );
}
