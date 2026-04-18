package com.xialuo.campusshare.module.resource.service.impl;

import com.xialuo.campusshare.entity.ProductEntity;
import com.xialuo.campusshare.module.order.mapper.OrderMapper;
import com.xialuo.campusshare.module.resource.dto.ProductCommentListResponseDto;
import com.xialuo.campusshare.module.resource.mapper.ProductCommentMapper;
import com.xialuo.campusshare.module.resource.mapper.ProductMapper;
import com.xialuo.campusshare.module.user.mapper.UserMapper;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 商品评论服务测试
 */
class ProductCommentServiceImplTest {

    /**
     * 评论列表应返回卖家信用统计
     */
    @Test
    void ListProductCommentsShouldContainSellerCreditSummary() {
        ProductCommentMapper productCommentMapper = mock(ProductCommentMapper.class);
        ProductMapper productMapper = mock(ProductMapper.class);
        OrderMapper orderMapper = mock(OrderMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        ProductCommentServiceImpl service = new ProductCommentServiceImpl(
            productCommentMapper,
            productMapper,
            orderMapper,
            userMapper
        );

        ProductEntity productEntity = new ProductEntity();
        productEntity.SetProductId(2001L);
        productEntity.SetSellerUserId(3001L);
        productEntity.SetOnShelf(Boolean.TRUE);
        when(productMapper.FindProductById(2001L)).thenReturn(productEntity);

        when(productCommentMapper.ListCommentsByProductId(2001L, 0, 20)).thenReturn(List.of());
        when(productCommentMapper.CountCommentsByProductId(2001L)).thenReturn(0L);
        when(productCommentMapper.AverageScoreByProductId(2001L)).thenReturn(BigDecimal.ZERO);
        when(productCommentMapper.CountCommentsBySellerUserId(3001L)).thenReturn(5L);
        when(productCommentMapper.AverageScoreBySellerUserId(3001L)).thenReturn(new BigDecimal("4.60"));
        when(productCommentMapper.CountPositiveCommentsBySellerUserId(3001L, 4)).thenReturn(4L);

        ProductCommentListResponseDto responseDto = service.ListProductComments(2001L, 1, 20);

        Assertions.assertNotNull(responseDto);
        Assertions.assertEquals(3001L, responseDto.GetSellerUserId());
        Assertions.assertEquals(5L, responseDto.GetSellerScoreCount());
        Assertions.assertEquals(new BigDecimal("4.60"), responseDto.GetSellerAverageScore());
        Assertions.assertEquals(new BigDecimal("80.00"), responseDto.GetSellerPositiveRate());
    }
}
