package com.xialuo.campusshare.module.order.service.impl;

import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.entity.OrderEntity;
import com.xialuo.campusshare.entity.ProductEntity;
import com.xialuo.campusshare.enums.OrderStatusEnum;
import com.xialuo.campusshare.enums.ProductStatusEnum;
import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.module.order.dto.CreateOrderRequestDto;
import com.xialuo.campusshare.module.order.dto.OrderResponseDto;
import com.xialuo.campusshare.module.order.mapper.OrderMapper;
import com.xialuo.campusshare.module.order.service.OrderService;
import com.xialuo.campusshare.module.resource.mapper.ProductMapper;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 订单服务实现
 */
@Service
public class OrderServiceImpl implements OrderService {
    /** 订单号前缀 */
    private static final String ORDER_NO_PREFIX = "CSO";

    /** 订单Mapper */
    private final OrderMapper orderMapper;
    /** 商品Mapper */
    private final ProductMapper productMapper;

    public OrderServiceImpl(OrderMapper orderMapper, ProductMapper productMapper) {
        this.orderMapper = orderMapper;
        this.productMapper = productMapper;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponseDto CreateOrder(CreateOrderRequestDto requestDto, Long currentUserId) {
        ProductEntity productEntity = productMapper.FindProductById(requestDto.GetProductId());
        if (productEntity == null) {
            throw new BusinessException(BizCodeEnum.PRODUCT_NOT_FOUND, "商品不存在");
        }
        ValidateProductPurchasable(productEntity, currentUserId);

        Integer lockRows = productMapper.LockProductForOrder(productEntity.GetProductId(), LocalDateTime.now());
        if (lockRows == null || lockRows <= 0) {
            throw new BusinessException(BizCodeEnum.PRODUCT_UNAVAILABLE, "商品当前不可下单");
        }

        OrderEntity orderEntity = new OrderEntity();
        orderEntity.SetOrderNo(BuildOrderNo());
        orderEntity.SetProductId(productEntity.GetProductId());
        orderEntity.SetBuyerUserId(currentUserId);
        orderEntity.SetSellerUserId(productEntity.GetSellerUserId());
        orderEntity.SetOrderStatus(OrderStatusEnum.PENDING_SELLER_CONFIRM);
        orderEntity.SetOrderAmount(productEntity.GetPrice());
        orderEntity.SetTradeLocation(requestDto.GetTradeLocation());
        orderEntity.SetCreateTime(LocalDateTime.now());
        orderEntity.SetUpdateTime(LocalDateTime.now());
        orderEntity.SetDeleted(Boolean.FALSE);

        orderMapper.InsertOrder(orderEntity);
        return BuildOrderResponse(orderEntity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponseDto CancelOrder(Long orderId, Long currentUserId, UserRoleEnum currentUserRole) {
        OrderEntity orderEntity = GetOrderById(orderId);
        ValidateOrderParticipant(orderEntity, currentUserId, currentUserRole);
        ValidateTransition(orderEntity.GetOrderStatus(), "cancel");

        orderEntity.SetOrderStatus(OrderStatusEnum.CANCELED);
        orderEntity.SetUpdateTime(LocalDateTime.now());
        orderMapper.UpdateOrder(orderEntity);
        productMapper.ReleaseProductOrderLock(orderEntity.GetProductId(), LocalDateTime.now());
        return BuildOrderResponse(orderEntity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponseDto ConfirmOrder(Long orderId, Long currentUserId) {
        OrderEntity orderEntity = GetOrderById(orderId);
        if (!currentUserId.equals(orderEntity.GetSellerUserId())) {
            throw new BusinessException(BizCodeEnum.ORDER_PERMISSION_DENIED, "仅卖家可确认订单");
        }
        ValidateTransition(orderEntity.GetOrderStatus(), "confirm");

        orderEntity.SetOrderStatus(OrderStatusEnum.PENDING_OFFLINE_TRADE);
        orderEntity.SetSellerConfirmTime(LocalDateTime.now());
        orderEntity.SetUpdateTime(LocalDateTime.now());
        orderMapper.UpdateOrder(orderEntity);
        return BuildOrderResponse(orderEntity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponseDto CompleteOrder(Long orderId, Long currentUserId) {
        OrderEntity orderEntity = GetOrderById(orderId);
        if (!currentUserId.equals(orderEntity.GetBuyerUserId())) {
            throw new BusinessException(BizCodeEnum.ORDER_PERMISSION_DENIED, "仅买家可完成订单");
        }
        ValidateTransition(orderEntity.GetOrderStatus(), "complete");

        orderEntity.SetOrderStatus(OrderStatusEnum.COMPLETED);
        orderEntity.SetBuyerCompleteTime(LocalDateTime.now());
        orderEntity.SetUpdateTime(LocalDateTime.now());
        orderMapper.UpdateOrder(orderEntity);
        return BuildOrderResponse(orderEntity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponseDto CloseOrder(Long orderId, Long currentUserId, UserRoleEnum currentUserRole, String closeReason) {
        OrderEntity orderEntity = GetOrderById(orderId);
        ValidateOrderParticipant(orderEntity, currentUserId, currentUserRole);
        ValidateTransition(orderEntity.GetOrderStatus(), "close");

        orderEntity.SetOrderStatus(OrderStatusEnum.CLOSED);
        orderEntity.SetCloseReason(closeReason);
        orderEntity.SetCloseTime(LocalDateTime.now());
        orderEntity.SetUpdateTime(LocalDateTime.now());
        orderMapper.UpdateOrder(orderEntity);
        productMapper.ReleaseProductOrderLock(orderEntity.GetProductId(), LocalDateTime.now());
        return BuildOrderResponse(orderEntity);
    }

    @Override
    public OrderResponseDto GetOrderDetail(Long orderId, Long currentUserId, UserRoleEnum currentUserRole) {
        OrderEntity orderEntity = GetOrderById(orderId);
        ValidateOrderParticipant(orderEntity, currentUserId, currentUserRole);
        return BuildOrderResponse(orderEntity);
    }

    /**
     * 构建订单号
     */
    private String BuildOrderNo() {
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String randomPart = Long.toString(System.nanoTime()).substring(8);
        return ORDER_NO_PREFIX + datePart + randomPart;
    }

    /**
     * 按ID查询订单
     */
    private OrderEntity GetOrderById(Long orderId) {
        OrderEntity orderEntity = orderMapper.FindOrderById(orderId);
        if (orderEntity == null) {
            throw new BusinessException(BizCodeEnum.ORDER_NOT_FOUND, "订单不存在");
        }
        return orderEntity;
    }

    /**
     * 校验商品可下单
     */
    private void ValidateProductPurchasable(ProductEntity productEntity, Long currentUserId) {
        if (currentUserId.equals(productEntity.GetSellerUserId())) {
            throw new BusinessException(BizCodeEnum.ORDER_SELF_PURCHASE_DENIED, "禁止购买自己商品");
        }
        if (!Boolean.TRUE.equals(productEntity.GetOnShelf())
            || productEntity.GetHasEffectiveOrder()
            || productEntity.GetProductStatus() != ProductStatusEnum.PUBLISHED) {
            throw new BusinessException(BizCodeEnum.PRODUCT_UNAVAILABLE, "商品当前不可下单");
        }
    }

    /**
     * 校验状态迁移
     */
    private void ValidateTransition(OrderStatusEnum currentStatus, String action) {
        switch (action) {
            case "cancel" -> {
                if (currentStatus != OrderStatusEnum.PENDING_SELLER_CONFIRM
                    && currentStatus != OrderStatusEnum.PENDING_OFFLINE_TRADE
                    && currentStatus != OrderStatusEnum.PENDING_BUYER_CONFIRM) {
                    throw new BusinessException(BizCodeEnum.ORDER_STATUS_INVALID, "当前状态不允许取消");
                }
            }
            case "confirm" -> {
                if (currentStatus != OrderStatusEnum.PENDING_SELLER_CONFIRM) {
                    throw new BusinessException(BizCodeEnum.ORDER_STATUS_INVALID, "当前状态不允许确认");
                }
            }
            case "complete" -> {
                if (currentStatus != OrderStatusEnum.PENDING_OFFLINE_TRADE
                    && currentStatus != OrderStatusEnum.PENDING_BUYER_CONFIRM) {
                    throw new BusinessException(BizCodeEnum.ORDER_STATUS_INVALID, "当前状态不允许完成");
                }
            }
            case "close" -> {
                if (currentStatus != OrderStatusEnum.PENDING_SELLER_CONFIRM
                    && currentStatus != OrderStatusEnum.PENDING_OFFLINE_TRADE
                    && currentStatus != OrderStatusEnum.PENDING_BUYER_CONFIRM) {
                    throw new BusinessException(BizCodeEnum.ORDER_STATUS_INVALID, "当前状态不允许关闭");
                }
            }
            default -> throw new BusinessException(BizCodeEnum.ORDER_STATUS_INVALID, "不支持的状态操作");
        }
    }

    /**
     * 校验订单参与权限
     */
    private void ValidateOrderParticipant(OrderEntity orderEntity, Long currentUserId, UserRoleEnum currentUserRole) {
        if (currentUserRole == UserRoleEnum.ADMINISTRATOR) {
            return;
        }
        if (!currentUserId.equals(orderEntity.GetBuyerUserId())
            && !currentUserId.equals(orderEntity.GetSellerUserId())) {
            throw new BusinessException(BizCodeEnum.ORDER_PERMISSION_DENIED, "当前用户无订单操作权限");
        }
    }

    /**
     * 构建订单响应
     */
    private OrderResponseDto BuildOrderResponse(OrderEntity orderEntity) {
        OrderResponseDto responseDto = new OrderResponseDto();
        responseDto.SetOrderId(orderEntity.GetOrderId());
        responseDto.SetOrderNo(orderEntity.GetOrderNo());
        responseDto.SetProductId(orderEntity.GetProductId());
        responseDto.SetBuyerUserId(orderEntity.GetBuyerUserId());
        responseDto.SetSellerUserId(orderEntity.GetSellerUserId());
        responseDto.SetOrderStatus(orderEntity.GetOrderStatus());
        responseDto.SetOrderAmount(orderEntity.GetOrderAmount());
        responseDto.SetTradeLocation(orderEntity.GetTradeLocation());
        responseDto.SetSellerConfirmTime(orderEntity.GetSellerConfirmTime());
        responseDto.SetBuyerCompleteTime(orderEntity.GetBuyerCompleteTime());
        responseDto.SetCloseTime(orderEntity.GetCloseTime());
        responseDto.SetCloseReason(orderEntity.GetCloseReason());
        return responseDto;
    }
}
