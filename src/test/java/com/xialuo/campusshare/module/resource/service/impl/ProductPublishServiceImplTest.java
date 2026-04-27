package com.xialuo.campusshare.module.resource.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.common.service.ContentModerationService;
import com.xialuo.campusshare.entity.ProductEntity;
import com.xialuo.campusshare.entity.UserEntity;
import com.xialuo.campusshare.enums.NotificationTypeEnum;
import com.xialuo.campusshare.enums.ProductStatusEnum;
import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.enums.UserStatusEnum;
import com.xialuo.campusshare.module.admin.constant.SystemRuleKeyConstants;
import com.xialuo.campusshare.module.admin.service.SystemRuleConfigService;
import com.xialuo.campusshare.module.notification.service.NotificationService;
import com.xialuo.campusshare.module.order.mapper.OrderMapper;
import com.xialuo.campusshare.module.resource.dto.ProductDetailResponseDto;
import com.xialuo.campusshare.module.resource.dto.ProductReviewRequestDto;
import com.xialuo.campusshare.module.resource.dto.PublishProductRequestDto;
import com.xialuo.campusshare.module.resource.mapper.ProductMapper;
import com.xialuo.campusshare.module.user.mapper.UserMapper;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;

/**
 * Product publish service boundary tests.
 */
class ProductPublishServiceImplTest {

    @Test
    void PublishProductShouldRequireVerifiedSeller() {
        ProductMapper productMapper = mock(ProductMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        ProductPublishServiceImpl service = BuildService(productMapper, userMapper, mock(NotificationService.class));
        when(userMapper.FindUserById(10L)).thenReturn(BuildUser(10L, UserRoleEnum.STUDENT, UserStatusEnum.ACTIVE));

        assertThrows(BusinessException.class, () -> service.PublishProduct(BuildRequest(), 10L));
        verify(productMapper, never()).InsertProduct(any(ProductEntity.class));
    }

    @Test
    void PublishProductShouldRejectInactiveUser() {
        ProductMapper productMapper = mock(ProductMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        ProductPublishServiceImpl service = BuildService(productMapper, userMapper, mock(NotificationService.class));
        when(userMapper.FindUserById(10L)).thenReturn(BuildUser(10L, UserRoleEnum.VERIFIED_SELLER, UserStatusEnum.PENDING_REVIEW));

        assertThrows(BusinessException.class, () -> service.PublishProduct(BuildRequest(), 10L));
        verify(productMapper, never()).InsertProduct(any(ProductEntity.class));
    }

    @Test
    void PublishProductShouldEnterPendingReviewWhenReviewRequired() {
        ProductMapper productMapper = mock(ProductMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        ProductPublishServiceImpl service = BuildService(productMapper, userMapper, mock(NotificationService.class));
        when(userMapper.FindUserById(10L)).thenReturn(BuildUser(10L, UserRoleEnum.VERIFIED_SELLER, UserStatusEnum.ACTIVE));
        doAnswer(invocation -> {
            ProductEntity productEntity = invocation.getArgument(0);
            productEntity.SetProductId(100L);
            return 1;
        }).when(productMapper).InsertProduct(any(ProductEntity.class));
        when(productMapper.FindProductById(100L)).thenReturn(BuildProduct(100L, 10L, ProductStatusEnum.PENDING_REVIEW, false));

        ProductDetailResponseDto responseDto = service.PublishProduct(BuildRequest(), 10L);

        assertEquals(ProductStatusEnum.PENDING_REVIEW, responseDto.GetProductStatus());
        assertEquals(Boolean.FALSE, responseDto.GetOnShelf());
    }

    @Test
    void ReviewProductShouldPublishAndNotifySeller() {
        ProductMapper productMapper = mock(ProductMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        NotificationService notificationService = mock(NotificationService.class);
        ProductPublishServiceImpl service = BuildService(productMapper, userMapper, notificationService);
        ProductReviewRequestDto requestDto = new ProductReviewRequestDto();
        requestDto.SetApproved(Boolean.TRUE);
        requestDto.SetReviewRemark("ok");

        when(productMapper.FindProductById(100L)).thenReturn(
            BuildProduct(100L, 10L, ProductStatusEnum.PENDING_REVIEW, false),
            BuildProduct(100L, 10L, ProductStatusEnum.PUBLISHED, true)
        );
        when(productMapper.UpdateProductReviewStatus(
            eq(100L),
            eq(ProductStatusEnum.PUBLISHED),
            eq(Boolean.TRUE),
            any(LocalDateTime.class)
        )).thenReturn(1);

        ProductDetailResponseDto responseDto = service.ReviewProductByAdmin(100L, requestDto, 1L);

        assertEquals(ProductStatusEnum.PUBLISHED, responseDto.GetProductStatus());
        verify(notificationService).CreateNotification(
            eq(10L),
            eq(NotificationTypeEnum.REVIEW),
            any(),
            any(),
            eq("PRODUCT"),
            eq(100L)
        );
    }

    private ProductPublishServiceImpl BuildService(
        ProductMapper productMapper,
        UserMapper userMapper,
        NotificationService notificationService
    ) {
        SystemRuleConfigService systemRuleConfigService = mock(SystemRuleConfigService.class);
        when(systemRuleConfigService.GetRuleBooleanValueOrDefault(
            eq(SystemRuleKeyConstants.PRODUCT_REVIEW_REQUIRED),
            eq(Boolean.TRUE)
        )).thenReturn(Boolean.TRUE);
        return new ProductPublishServiceImpl(
            productMapper,
            mock(OrderMapper.class),
            userMapper,
            mock(ContentModerationService.class),
            systemRuleConfigService,
            notificationService
        );
    }

    private PublishProductRequestDto BuildRequest() {
        PublishProductRequestDto requestDto = new PublishProductRequestDto();
        requestDto.SetTitle("Used textbook");
        requestDto.SetCategory("Book");
        requestDto.SetConditionLevel("90%");
        requestDto.SetPrice(BigDecimal.valueOf(30));
        requestDto.SetTradeLocation("Library");
        requestDto.SetDescription("clean");
        requestDto.SetImageFileIds(List.of("image-file-id"));
        return requestDto;
    }

    private UserEntity BuildUser(Long userId, UserRoleEnum userRole, UserStatusEnum userStatus) {
        UserEntity userEntity = new UserEntity();
        userEntity.SetUserId(userId);
        userEntity.SetUserRole(userRole);
        userEntity.SetUserStatus(userStatus);
        return userEntity;
    }

    private ProductEntity BuildProduct(
        Long productId,
        Long sellerUserId,
        ProductStatusEnum productStatus,
        Boolean onShelf
    ) {
        ProductEntity productEntity = new ProductEntity();
        productEntity.SetProductId(productId);
        productEntity.SetSellerUserId(sellerUserId);
        productEntity.SetTitle("Used textbook");
        productEntity.SetCategory("Book");
        productEntity.SetConditionLevel("90%");
        productEntity.SetPrice(BigDecimal.valueOf(30));
        productEntity.SetTradeLocation("Library");
        productEntity.SetDescription("clean");
        productEntity.SetProductStatus(productStatus);
        productEntity.SetOnShelf(onShelf);
        productEntity.SetStockCount(1);
        productEntity.SetHasEffectiveOrder(Boolean.FALSE);
        productEntity.SetCreateTime(LocalDateTime.now());
        return productEntity;
    }
}
