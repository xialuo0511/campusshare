package com.xialuo.campusshare.module.order.controller;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import com.xialuo.campusshare.common.filter.SessionAuthFilter;
import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.module.order.dto.CreateOrderRequestDto;
import com.xialuo.campusshare.module.order.dto.OrderCloseRequestDto;
import com.xialuo.campusshare.module.order.dto.OrderResponseDto;
import com.xialuo.campusshare.module.order.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 订单接口
 */
@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
    /** 订单服务 */
    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * 创建订单
     */
    @PostMapping
    public ApiResponse<OrderResponseDto> CreateOrder(
        @RequestBody @Valid CreateOrderRequestDto requestDto,
        HttpServletRequest httpServletRequest
    ) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        OrderResponseDto responseDto = orderService.CreateOrder(requestDto, currentUserId);
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 查询订单详情
     */
    @GetMapping("/{orderId}")
    public ApiResponse<OrderResponseDto> GetOrderDetail(
        @PathVariable("orderId") Long orderId,
        HttpServletRequest httpServletRequest
    ) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        UserRoleEnum currentUserRole = GetCurrentUserRole(httpServletRequest);
        OrderResponseDto responseDto = orderService.GetOrderDetail(orderId, currentUserId, currentUserRole);
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 取消订单
     */
    @PostMapping("/{orderId}/cancel")
    public ApiResponse<OrderResponseDto> CancelOrder(
        @PathVariable("orderId") Long orderId,
        HttpServletRequest httpServletRequest
    ) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        UserRoleEnum currentUserRole = GetCurrentUserRole(httpServletRequest);
        OrderResponseDto responseDto = orderService.CancelOrder(orderId, currentUserId, currentUserRole);
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 卖家确认订单
     */
    @PostMapping("/{orderId}/confirm")
    public ApiResponse<OrderResponseDto> ConfirmOrder(
        @PathVariable("orderId") Long orderId,
        HttpServletRequest httpServletRequest
    ) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        OrderResponseDto responseDto = orderService.ConfirmOrder(orderId, currentUserId);
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 买家确认完成
     */
    @PostMapping("/{orderId}/complete")
    public ApiResponse<OrderResponseDto> CompleteOrder(
        @PathVariable("orderId") Long orderId,
        HttpServletRequest httpServletRequest
    ) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        OrderResponseDto responseDto = orderService.CompleteOrder(orderId, currentUserId);
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 关闭订单
     */
    @PostMapping("/{orderId}/close")
    public ApiResponse<OrderResponseDto> CloseOrder(
        @PathVariable("orderId") Long orderId,
        @RequestBody(required = false) OrderCloseRequestDto requestDto,
        HttpServletRequest httpServletRequest
    ) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        UserRoleEnum currentUserRole = GetCurrentUserRole(httpServletRequest);
        String closeReason = requestDto == null ? null : requestDto.GetCloseReason();
        OrderResponseDto responseDto = orderService.CloseOrder(orderId, currentUserId, currentUserRole, closeReason);
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 获取当前用户ID
     */
    private Long GetCurrentUserId(HttpServletRequest httpServletRequest) {
        Object currentUserId = httpServletRequest.getAttribute(SessionAuthFilter.CURRENT_USER_ID_ATTRIBUTE);
        if (currentUserId instanceof Long currentUserIdLong) {
            return currentUserIdLong;
        }
        return Long.parseLong(currentUserId.toString());
    }

    /**
     * 获取当前用户角色
     */
    private UserRoleEnum GetCurrentUserRole(HttpServletRequest httpServletRequest) {
        Object currentUserRole = httpServletRequest.getAttribute(SessionAuthFilter.CURRENT_USER_ROLE_ATTRIBUTE);
        if (currentUserRole instanceof UserRoleEnum userRoleEnum) {
            return userRoleEnum;
        }
        return UserRoleEnum.valueOf(currentUserRole.toString());
    }

    /**
     * 获取请求追踪ID
     */
    private String GetRequestId(HttpServletRequest httpServletRequest) {
        Object requestId = httpServletRequest.getAttribute(RequestIdFilter.REQUEST_ID_ATTRIBUTE);
        return requestId == null ? "" : requestId.toString();
    }
}
