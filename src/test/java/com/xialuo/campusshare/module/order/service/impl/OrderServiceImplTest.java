package com.xialuo.campusshare.module.order.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.entity.OrderEntity;
import com.xialuo.campusshare.entity.ProductEntity;
import com.xialuo.campusshare.enums.OrderStatusEnum;
import com.xialuo.campusshare.enums.ProductStatusEnum;
import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.module.order.dto.CreateOrderRequestDto;
import com.xialuo.campusshare.module.order.dto.OrderResponseDto;
import com.xialuo.campusshare.module.order.mapper.OrderMapper;
import com.xialuo.campusshare.module.resource.mapper.ProductMapper;
import com.xialuo.campusshare.module.user.mapper.UserMapper;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;

/**
 * Order service boundary tests.
 */
class OrderServiceImplTest {

    @Test
    void CreateOrderShouldLockProductAndInsertPendingOrder() {
        OrderMapper orderMapper = mock(OrderMapper.class);
        ProductMapper productMapper = mock(ProductMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        OrderServiceImpl orderService = new OrderServiceImpl(orderMapper, productMapper, userMapper);
        ProductEntity productEntity = BuildPublishedProduct(10L, 200L, false);
        CreateOrderRequestDto requestDto = BuildCreateOrderRequest(10L);

        when(productMapper.FindProductById(10L)).thenReturn(productEntity);
        when(productMapper.LockProductForOrder(eq(10L), any(LocalDateTime.class))).thenReturn(1);

        OrderResponseDto responseDto = orderService.CreateOrder(requestDto, 100L);

        verify(orderMapper).InsertOrder(any(OrderEntity.class));
        assertNotNull(responseDto.GetOrderNo());
        assertEquals(OrderStatusEnum.PENDING_SELLER_CONFIRM, responseDto.GetOrderStatus());
        assertEquals(100L, responseDto.GetBuyerUserId());
        assertEquals(200L, responseDto.GetSellerUserId());
    }

    @Test
    void CreateOrderShouldRejectConcurrentProductLockFailure() {
        OrderMapper orderMapper = mock(OrderMapper.class);
        ProductMapper productMapper = mock(ProductMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        OrderServiceImpl orderService = new OrderServiceImpl(orderMapper, productMapper, userMapper);
        ProductEntity productEntity = BuildPublishedProduct(10L, 200L, false);
        CreateOrderRequestDto requestDto = BuildCreateOrderRequest(10L);

        when(productMapper.FindProductById(10L)).thenReturn(productEntity);
        when(productMapper.LockProductForOrder(eq(10L), any(LocalDateTime.class))).thenReturn(0);

        assertThrows(BusinessException.class, () -> orderService.CreateOrder(requestDto, 100L));
        verify(orderMapper, never()).InsertOrder(any(OrderEntity.class));
    }

    @Test
    void ThirdPartyShouldNotReadOrderDetail() {
        OrderMapper orderMapper = mock(OrderMapper.class);
        ProductMapper productMapper = mock(ProductMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        OrderServiceImpl orderService = new OrderServiceImpl(orderMapper, productMapper, userMapper);

        when(orderMapper.FindOrderById(99L)).thenReturn(BuildOrder(99L, 100L, 200L, OrderStatusEnum.PENDING_OFFLINE_TRADE));

        assertThrows(
            BusinessException.class,
            () -> orderService.GetOrderDetail(99L, 300L, UserRoleEnum.STUDENT)
        );
    }

    @Test
    void SellerShouldNotCompleteBuyerConfirmStep() {
        OrderMapper orderMapper = mock(OrderMapper.class);
        ProductMapper productMapper = mock(ProductMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        OrderServiceImpl orderService = new OrderServiceImpl(orderMapper, productMapper, userMapper);

        when(orderMapper.FindOrderById(99L)).thenReturn(BuildOrder(99L, 100L, 200L, OrderStatusEnum.PENDING_BUYER_CONFIRM));

        assertThrows(BusinessException.class, () -> orderService.CompleteOrder(99L, 200L));
        verify(productMapper, never()).FinalizeProductOrderSuccess(any(), any());
    }

    @Test
    void ClosedOrderShouldRejectFurtherConfirm() {
        OrderMapper orderMapper = mock(OrderMapper.class);
        ProductMapper productMapper = mock(ProductMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        OrderServiceImpl orderService = new OrderServiceImpl(orderMapper, productMapper, userMapper);

        when(orderMapper.FindOrderById(99L)).thenReturn(BuildOrder(99L, 100L, 200L, OrderStatusEnum.CLOSED));

        assertThrows(BusinessException.class, () -> orderService.ConfirmOrder(99L, 200L));
        verify(orderMapper, never()).UpdateOrder(any(OrderEntity.class));
    }

    private CreateOrderRequestDto BuildCreateOrderRequest(Long productId) {
        CreateOrderRequestDto requestDto = new CreateOrderRequestDto();
        requestDto.SetProductId(productId);
        requestDto.SetTradeLocation("Library gate");
        return requestDto;
    }

    private ProductEntity BuildPublishedProduct(Long productId, Long sellerUserId, Boolean hasEffectiveOrder) {
        ProductEntity productEntity = new ProductEntity();
        productEntity.SetProductId(productId);
        productEntity.SetSellerUserId(sellerUserId);
        productEntity.SetPrice(BigDecimal.valueOf(25));
        productEntity.SetProductStatus(ProductStatusEnum.PUBLISHED);
        productEntity.SetOnShelf(Boolean.TRUE);
        productEntity.SetHasEffectiveOrder(hasEffectiveOrder);
        return productEntity;
    }

    private OrderEntity BuildOrder(
        Long orderId,
        Long buyerUserId,
        Long sellerUserId,
        OrderStatusEnum orderStatus
    ) {
        OrderEntity orderEntity = new OrderEntity();
        orderEntity.SetOrderId(orderId);
        orderEntity.SetOrderNo("CSO202604270001");
        orderEntity.SetProductId(10L);
        orderEntity.SetBuyerUserId(buyerUserId);
        orderEntity.SetSellerUserId(sellerUserId);
        orderEntity.SetOrderStatus(orderStatus);
        orderEntity.SetOrderAmount(BigDecimal.valueOf(25));
        orderEntity.SetTradeLocation("Library gate");
        return orderEntity;
    }
}
