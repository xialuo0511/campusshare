package com.xialuo.campusshare.module.material.controller;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import com.xialuo.campusshare.common.filter.SessionAuthFilter;
import com.xialuo.campusshare.module.admin.service.AuditLogService;
import com.xialuo.campusshare.module.material.dto.MaterialListResponseDto;
import com.xialuo.campusshare.module.material.dto.MaterialResponseDto;
import com.xialuo.campusshare.module.material.dto.MaterialReviewRequestDto;
import com.xialuo.campusshare.module.material.service.MaterialService;
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
 * 管理员资料接口
 */
@RestController
@RequestMapping("/api/v1/admin/materials")
public class AdminMaterialController {
    /** 资料服务 */
    private final MaterialService materialService;
    /** 审计日志服务 */
    private final AuditLogService auditLogService;

    public AdminMaterialController(MaterialService materialService, AuditLogService auditLogService) {
        this.materialService = materialService;
        this.auditLogService = auditLogService;
    }

    /**
     * 查询待审核资料
     */
    @GetMapping("/pending")
    public ApiResponse<MaterialListResponseDto> ListPendingMaterials(
        @RequestParam(value = "pageNo", required = false) Integer pageNo,
        @RequestParam(value = "pageSize", required = false) Integer pageSize,
        HttpServletRequest httpServletRequest
    ) {
        MaterialListResponseDto responseDto = materialService.ListPendingReviewMaterials(pageNo, pageSize);
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 审核资料
     */
    @PostMapping("/{materialId}/review")
    public ApiResponse<MaterialResponseDto> ReviewMaterial(
        @PathVariable("materialId") Long materialId,
        @RequestBody @Valid MaterialReviewRequestDto requestDto,
        HttpServletRequest httpServletRequest
    ) {
        Long adminUserId = GetCurrentUserId(httpServletRequest);
        MaterialResponseDto responseDto = materialService.ReviewMaterial(materialId, requestDto, adminUserId);
        auditLogService.RecordAuditLog(
            adminUserId,
            "MATERIAL_REVIEW",
            "MATERIAL",
            materialId,
            "SUCCESS",
            BuildMaterialReviewAuditDetail(requestDto)
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
     * 构建资料审核审计明细
     */
    private String BuildMaterialReviewAuditDetail(MaterialReviewRequestDto requestDto) {
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
