package com.xialuo.campusshare.module.material.controller;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import com.xialuo.campusshare.common.filter.SessionAuthFilter;
import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.module.material.dto.MaterialDownloadResponseDto;
import com.xialuo.campusshare.module.material.dto.MaterialOfflineRequestDto;
import com.xialuo.campusshare.module.material.dto.MaterialResponseDto;
import com.xialuo.campusshare.module.material.dto.UploadMaterialRequestDto;
import com.xialuo.campusshare.module.material.service.MaterialService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 资料接口
 */
@RestController
@RequestMapping("/api/v1/materials")
public class MaterialController {
    /** 资料服务 */
    private final MaterialService materialService;

    public MaterialController(MaterialService materialService) {
        this.materialService = materialService;
    }

    /**
     * 上传资料
     */
    @PostMapping
    public ApiResponse<MaterialResponseDto> UploadMaterial(
        @RequestBody @Valid UploadMaterialRequestDto requestDto,
        HttpServletRequest httpServletRequest
    ) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        MaterialResponseDto responseDto = materialService.UploadMaterial(requestDto, currentUserId);
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 查询资料详情
     */
    @GetMapping("/{materialId}")
    public ApiResponse<MaterialResponseDto> GetMaterialDetail(
        @PathVariable("materialId") Long materialId,
        HttpServletRequest httpServletRequest
    ) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        UserRoleEnum currentUserRole = GetCurrentUserRole(httpServletRequest);
        MaterialResponseDto responseDto = materialService.GetMaterialDetail(
            materialId,
            currentUserId,
            currentUserRole
        );
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 下架资料
     */
    @PostMapping("/{materialId}/offline")
    public ApiResponse<MaterialResponseDto> OfflineMaterial(
        @PathVariable("materialId") Long materialId,
        @RequestBody(required = false) @Valid MaterialOfflineRequestDto requestDto,
        HttpServletRequest httpServletRequest
    ) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        UserRoleEnum currentUserRole = GetCurrentUserRole(httpServletRequest);
        String offlineRemark = requestDto == null ? null : requestDto.GetOfflineRemark();
        MaterialResponseDto responseDto = materialService.OfflineMaterial(
            materialId,
            currentUserId,
            currentUserRole,
            offlineRemark
        );
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 下载资料
     */
    @PostMapping("/{materialId}/download")
    public ApiResponse<MaterialDownloadResponseDto> DownloadMaterial(
        @PathVariable("materialId") Long materialId,
        HttpServletRequest httpServletRequest
    ) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        MaterialDownloadResponseDto responseDto = materialService.DownloadMaterial(materialId, currentUserId);
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
