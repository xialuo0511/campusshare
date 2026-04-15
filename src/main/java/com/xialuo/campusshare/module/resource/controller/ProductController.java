package com.xialuo.campusshare.module.resource.controller;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import com.xialuo.campusshare.common.filter.SessionAuthFilter;
import com.xialuo.campusshare.module.resource.dto.ProductDetailResponseDto;
import com.xialuo.campusshare.module.resource.dto.ProductListResponseDto;
import com.xialuo.campusshare.module.resource.dto.PublishProductRequestDto;
import com.xialuo.campusshare.module.resource.service.ProductPublishService;
import com.xialuo.campusshare.module.resource.service.ProductQueryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 商品查询接口
 */
@RestController
@RequestMapping("/api/v1/products")
public class ProductController {
    /** 商品查询服务 */
    private final ProductQueryService productQueryService;
    /** 商品发布服务 */
    private final ProductPublishService productPublishService;

    public ProductController(ProductQueryService productQueryService, ProductPublishService productPublishService) {
        this.productQueryService = productQueryService;
        this.productPublishService = productPublishService;
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
}
