package com.xialuo.campusshare.module.resource.controller;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import com.xialuo.campusshare.common.filter.SessionAuthFilter;
import com.xialuo.campusshare.module.admin.service.AuditLogService;
import com.xialuo.campusshare.module.resource.dto.ProductDetailResponseDto;
import com.xialuo.campusshare.module.resource.dto.ProductListResponseDto;
import com.xialuo.campusshare.module.resource.dto.ProductOfflineRequestDto;
import com.xialuo.campusshare.module.resource.dto.ProductReviewRequestDto;
import com.xialuo.campusshare.module.resource.service.ProductPublishService;
import com.xialuo.campusshare.module.resource.service.ProductQueryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 管理员商品接口
 */
@RestController
@RequestMapping("/api/v1/admin/products")
public class AdminProductController {
    /** 商品查询服务 */
    private final ProductQueryService productQueryService;
    /** 商品发布服务 */
    private final ProductPublishService productPublishService;
    /** 审计日志服务 */
    private final AuditLogService auditLogService;

    public AdminProductController(
        ProductQueryService productQueryService,
        ProductPublishService productPublishService,
        AuditLogService auditLogService
    ) {
        this.productQueryService = productQueryService;
        this.productPublishService = productPublishService;
        this.auditLogService = auditLogService;
    }

    /**
     * 管理后台分页查询商品
     */
    @GetMapping
    public ApiResponse<ProductListResponseDto> ListProductsForAdmin(
        @RequestParam(value = "pageNo", required = false) Integer pageNo,
        @RequestParam(value = "pageSize", required = false) Integer pageSize,
        @RequestParam(value = "keyword", required = false) String keyword,
        @RequestParam(value = "category", required = false) String category,
        @RequestParam(value = "productStatus", required = false) String productStatus,
        @RequestParam(value = "sellerUserId", required = false) Long sellerUserId,
        HttpServletRequest httpServletRequest
    ) {
        ProductListResponseDto responseDto = productQueryService.ListProductsForAdmin(
            pageNo,
            pageSize,
            keyword,
            category,
            productStatus,
            sellerUserId
        );
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 查询待审核商品
     */
    @GetMapping("/pending")
    public ApiResponse<ProductListResponseDto> ListPendingProducts(
        @RequestParam(value = "pageNo", required = false) Integer pageNo,
        @RequestParam(value = "pageSize", required = false) Integer pageSize,
        HttpServletRequest httpServletRequest
    ) {
        ProductListResponseDto responseDto = productQueryService.ListProductsForAdmin(
            pageNo,
            pageSize,
            null,
            null,
            "PENDING_REVIEW",
            null
        );
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 管理员强制下架商品
     */
    @PostMapping("/{productId}/offline")
    public ApiResponse<ProductDetailResponseDto> OfflineProductByAdmin(
        @PathVariable("productId") Long productId,
        @RequestBody(required = false) @Valid ProductOfflineRequestDto requestDto,
        HttpServletRequest httpServletRequest
    ) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        String offlineRemark = requestDto == null ? null : requestDto.GetOfflineRemark();
        ProductDetailResponseDto responseDto = productPublishService.ForceOfflineProductByAdmin(
            productId,
            currentUserId,
            offlineRemark
        );
        auditLogService.RecordAuditLog(
            currentUserId,
            "PRODUCT_FORCE_OFFLINE",
            "PRODUCT",
            productId,
            "SUCCESS",
            BuildProductOfflineAuditDetail(offlineRemark)
        );
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 管理员审核商品
     */
    @PostMapping("/{productId}/review")
    public ApiResponse<ProductDetailResponseDto> ReviewProductByAdmin(
        @PathVariable("productId") Long productId,
        @RequestBody @Valid ProductReviewRequestDto requestDto,
        HttpServletRequest httpServletRequest
    ) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        ProductDetailResponseDto responseDto = productPublishService.ReviewProductByAdmin(
            productId,
            requestDto,
            currentUserId
        );
        auditLogService.RecordAuditLog(
            currentUserId,
            "PRODUCT_REVIEW",
            "PRODUCT",
            productId,
            "SUCCESS",
            BuildProductReviewAuditDetail(requestDto)
        );
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 获取请求追踪ID
     */
    private String GetRequestId(HttpServletRequest httpServletRequest) {
        Object requestId = httpServletRequest.getAttribute(RequestIdFilter.REQUEST_ID_ATTRIBUTE);
        return requestId == null ? "" : requestId.toString();
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
     * 构建下架审计明细
     */
    private String BuildProductOfflineAuditDetail(String offlineRemark) {
        if (offlineRemark == null || offlineRemark.isBlank()) {
            return "offlineRemark=";
        }
        return "offlineRemark=" + offlineRemark.trim();
    }

    /**
     * 构建审核审计明细
     */
    private String BuildProductReviewAuditDetail(ProductReviewRequestDto requestDto) {
        if (requestDto == null) {
            return "";
        }
        StringBuilder detailBuilder = new StringBuilder();
        detailBuilder.append("approved=").append(Boolean.TRUE.equals(requestDto.GetApproved()));
        detailBuilder.append(",reviewRemark=").append(SafeText(requestDto.GetReviewRemark()));
        return detailBuilder.toString();
    }

    /**
     * 安全文本
     */
    private String SafeText(String text) {
        return text == null ? "" : text.trim();
    }
}
