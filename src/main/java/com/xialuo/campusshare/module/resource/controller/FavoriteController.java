package com.xialuo.campusshare.module.resource.controller;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import com.xialuo.campusshare.common.filter.SessionAuthFilter;
import com.xialuo.campusshare.module.material.dto.MaterialFavoriteResponseDto;
import com.xialuo.campusshare.module.resource.dto.ProductFavoriteResponseDto;
import com.xialuo.campusshare.module.resource.service.FavoriteService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 收藏接口
 */
@RestController
@RequestMapping("/api/v1/favorites")
public class FavoriteController {
    /** 收藏服务 */
    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    /**
     * 查询收藏状态
     */
    @GetMapping("/products/{productId}")
    public ApiResponse<ProductFavoriteResponseDto> GetProductFavoriteState(
        @PathVariable("productId") Long productId,
        HttpServletRequest httpServletRequest
    ) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        ProductFavoriteResponseDto responseDto = favoriteService.GetProductFavoriteState(productId, currentUserId);
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 切换收藏状态
     */
    @PostMapping("/products/{productId}/toggle")
    public ApiResponse<ProductFavoriteResponseDto> ToggleProductFavorite(
        @PathVariable("productId") Long productId,
        HttpServletRequest httpServletRequest
    ) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        ProductFavoriteResponseDto responseDto = favoriteService.ToggleProductFavorite(productId, currentUserId);
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 查询资料收藏状态
     */
    @GetMapping("/materials/{materialId}")
    public ApiResponse<MaterialFavoriteResponseDto> GetMaterialFavoriteState(
        @PathVariable("materialId") Long materialId,
        HttpServletRequest httpServletRequest
    ) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        MaterialFavoriteResponseDto responseDto = favoriteService.GetMaterialFavoriteState(materialId, currentUserId);
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 切换资料收藏状态
     */
    @PostMapping("/materials/{materialId}/toggle")
    public ApiResponse<MaterialFavoriteResponseDto> ToggleMaterialFavorite(
        @PathVariable("materialId") Long materialId,
        HttpServletRequest httpServletRequest
    ) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        MaterialFavoriteResponseDto responseDto = favoriteService.ToggleMaterialFavorite(materialId, currentUserId);
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
        return currentUserId == null ? null : Long.parseLong(currentUserId.toString());
    }
}
