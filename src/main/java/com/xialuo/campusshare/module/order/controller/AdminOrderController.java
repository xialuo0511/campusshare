package com.xialuo.campusshare.module.order.controller;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import com.xialuo.campusshare.common.filter.SessionAuthFilter;
import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.module.admin.service.AuditLogService;
import com.xialuo.campusshare.module.order.dto.OrderCloseRequestDto;
import com.xialuo.campusshare.module.order.dto.OrderListResponseDto;
import com.xialuo.campusshare.module.order.dto.OrderResponseDto;
import com.xialuo.campusshare.module.order.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 管理员订单接口
 */
@RestController
@RequestMapping("/api/v1/admin/orders")
public class AdminOrderController {
    /** 订单服务 */
    private final OrderService orderService;
    /** 审计日志服务 */
    private final AuditLogService auditLogService;

    public AdminOrderController(
        OrderService orderService,
        AuditLogService auditLogService
    ) {
        this.orderService = orderService;
        this.auditLogService = auditLogService;
    }

    /**
     * 管理后台分页查询订单
     */
    @GetMapping
    public ApiResponse<OrderListResponseDto> ListOrdersForAdmin(
        @RequestParam(value = "pageNo", required = false) Integer pageNo,
        @RequestParam(value = "pageSize", required = false) Integer pageSize,
        @RequestParam(value = "statusFilter", required = false) String statusFilter,
        HttpServletRequest httpServletRequest
    ) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        OrderListResponseDto responseDto = orderService.ListMyOrders(
            currentUserId,
            UserRoleEnum.ADMINISTRATOR,
            pageNo,
            pageSize,
            statusFilter
        );
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 查询订单详情
     */
    @GetMapping("/{orderId}")
    public ApiResponse<OrderResponseDto> GetOrderDetailForAdmin(
        @PathVariable("orderId") Long orderId,
        HttpServletRequest httpServletRequest
    ) {
        OrderResponseDto responseDto = orderService.GetOrderDetail(
            orderId,
            GetCurrentUserId(httpServletRequest),
            UserRoleEnum.ADMINISTRATOR
        );
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 强制关闭订单
     */
    @PostMapping("/{orderId}/close")
    public ApiResponse<OrderResponseDto> CloseOrderForAdmin(
        @PathVariable("orderId") Long orderId,
        @RequestBody(required = false) OrderCloseRequestDto requestDto,
        HttpServletRequest httpServletRequest
    ) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        String closeReason = requestDto == null ? null : requestDto.GetCloseReason();
        OrderResponseDto responseDto = orderService.CloseOrder(
            orderId,
            currentUserId,
            UserRoleEnum.ADMINISTRATOR,
            closeReason
        );
        auditLogService.RecordAuditLog(
            currentUserId,
            "ORDER_FORCE_CLOSE",
            "ORDER",
            orderId,
            "SUCCESS",
            BuildOrderCloseAuditDetail(closeReason)
        );
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
     * 获取请求追踪ID
     */
    private String GetRequestId(HttpServletRequest httpServletRequest) {
        Object requestId = httpServletRequest.getAttribute(RequestIdFilter.REQUEST_ID_ATTRIBUTE);
        return requestId == null ? "" : requestId.toString();
    }

    /**
     * 构建关单审计明细
     */
    private String BuildOrderCloseAuditDetail(String closeReason) {
        if (closeReason == null || closeReason.isBlank()) {
            return "closeReason=";
        }
        return "closeReason=" + closeReason.trim();
    }
}

