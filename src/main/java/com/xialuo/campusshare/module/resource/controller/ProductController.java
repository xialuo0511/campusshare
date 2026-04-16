package com.xialuo.campusshare.module.resource.controller;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import com.xialuo.campusshare.common.filter.SessionAuthFilter;
import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.module.resource.dto.CreateProductCommentRequestDto;
import com.xialuo.campusshare.module.resource.dto.ProductCommentListResponseDto;
import com.xialuo.campusshare.module.resource.dto.ProductCommentResponseDto;
import com.xialuo.campusshare.module.resource.dto.ProductDetailResponseDto;
import com.xialuo.campusshare.module.resource.dto.ProductListResponseDto;
import com.xialuo.campusshare.module.resource.dto.ProductOfflineRequestDto;
import com.xialuo.campusshare.module.resource.dto.PublishProductRequestDto;
import com.xialuo.campusshare.module.resource.service.ProductCommentService;
import com.xialuo.campusshare.module.resource.service.ProductPublishService;
import com.xialuo.campusshare.module.resource.service.ProductQueryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 商品接口
 */
@RestController
@RequestMapping("/api/v1/products")
public class ProductController {
    /** 商品查询服务 */
    private final ProductQueryService productQueryService;
    /** 商品发布服务 */
    private final ProductPublishService productPublishService;
    /** 商品评论服务 */
    private final ProductCommentService productCommentService;

    public ProductController(
        ProductQueryService productQueryService,
        ProductPublishService productPublishService,
        ProductCommentService productCommentService
    ) {
        this.productQueryService = productQueryService;
        this.productPublishService = productPublishService;
        this.productCommentService = productCommentService;
    }

    /**
     * 分页查询商品
     */
    @GetMapping
    public ApiResponse<ProductListResponseDto> ListProducts(
        @RequestParam(value = "pageNo", required = false) Integer pageNo,
        @RequestParam(value = "pageSize", required = false) Integer pageSize,
        @RequestParam(value = "keyword", required = false) String keyword,
        @RequestParam(value = "category", required = false) String category,
        @RequestParam(value = "conditionLevel", required = false) String conditionLevel,
        @RequestParam(value = "tradeLocation", required = false) String tradeLocation,
        @RequestParam(value = "minPrice", required = false) BigDecimal minPrice,
        @RequestParam(value = "maxPrice", required = false) BigDecimal maxPrice,
        @RequestParam(value = "sortType", required = false) String sortType,
        HttpServletRequest httpServletRequest
    ) {
        ProductListResponseDto responseDto = productQueryService.ListProducts(
            pageNo,
            pageSize,
            keyword,
            category,
            conditionLevel,
            tradeLocation,
            minPrice,
            maxPrice,
            sortType
        );
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 分页查询我的商品
     */
    @GetMapping("/my")
    public ApiResponse<ProductListResponseDto> ListMyProducts(
        @RequestParam(value = "pageNo", required = false) Integer pageNo,
        @RequestParam(value = "pageSize", required = false) Integer pageSize,
        @RequestParam(value = "productStatus", required = false) String productStatus,
        HttpServletRequest httpServletRequest
    ) {
        ProductListResponseDto responseDto = productQueryService.ListMyProducts(
            GetCurrentUserId(httpServletRequest),
            pageNo,
            pageSize,
            productStatus
        );
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 查询商品详情
     */
    @GetMapping("/{productId}")
    public ApiResponse<ProductDetailResponseDto> GetProductDetail(
        @PathVariable("productId") Long productId,
        HttpServletRequest httpServletRequest
    ) {
        ProductDetailResponseDto responseDto = productQueryService.GetProductDetail(productId);
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 发布商品
     */
    @PostMapping
    public ApiResponse<ProductDetailResponseDto> PublishProduct(
        @RequestBody @Valid PublishProductRequestDto requestDto,
        HttpServletRequest httpServletRequest
    ) {
        ProductDetailResponseDto responseDto = productPublishService.PublishProduct(
            requestDto,
            GetCurrentUserId(httpServletRequest)
        );
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 编辑商品
     */
    @PutMapping("/{productId}")
    public ApiResponse<ProductDetailResponseDto> UpdateProduct(
        @PathVariable("productId") Long productId,
        @RequestBody @Valid PublishProductRequestDto requestDto,
        HttpServletRequest httpServletRequest
    ) {
        ProductDetailResponseDto responseDto = productPublishService.UpdateProduct(
            productId,
            requestDto,
            GetCurrentUserId(httpServletRequest),
            GetCurrentUserRole(httpServletRequest)
        );
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 下架商品
     */
    @PostMapping("/{productId}/offline")
    public ApiResponse<ProductDetailResponseDto> OfflineProduct(
        @PathVariable("productId") Long productId,
        @RequestBody(required = false) @Valid ProductOfflineRequestDto requestDto,
        HttpServletRequest httpServletRequest
    ) {
        String offlineRemark = requestDto == null ? null : requestDto.GetOfflineRemark();
        ProductDetailResponseDto responseDto = productPublishService.OfflineProduct(
            productId,
            GetCurrentUserId(httpServletRequest),
            GetCurrentUserRole(httpServletRequest),
            offlineRemark
        );
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 分页查询商品评论
     */
    @GetMapping("/{productId}/comments")
    public ApiResponse<ProductCommentListResponseDto> ListProductComments(
        @PathVariable("productId") Long productId,
        @RequestParam(value = "pageNo", required = false) Integer pageNo,
        @RequestParam(value = "pageSize", required = false) Integer pageSize,
        HttpServletRequest httpServletRequest
    ) {
        ProductCommentListResponseDto responseDto = productCommentService.ListProductComments(productId, pageNo, pageSize);
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 提交商品评论
     */
    @PostMapping("/{productId}/comments")
    public ApiResponse<ProductCommentResponseDto> CreateProductComment(
        @PathVariable("productId") Long productId,
        @RequestBody @Valid CreateProductCommentRequestDto requestDto,
        HttpServletRequest httpServletRequest
    ) {
        ProductCommentResponseDto responseDto = productCommentService.CreateProductComment(
            productId,
            requestDto,
            GetCurrentUserId(httpServletRequest)
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
     * 获取当前用户角色
     */
    private UserRoleEnum GetCurrentUserRole(HttpServletRequest httpServletRequest) {
        Object currentUserRole = httpServletRequest.getAttribute(SessionAuthFilter.CURRENT_USER_ROLE_ATTRIBUTE);
        if (currentUserRole instanceof UserRoleEnum userRoleEnum) {
            return userRoleEnum;
        }
        return UserRoleEnum.valueOf(currentUserRole.toString());
    }
}
