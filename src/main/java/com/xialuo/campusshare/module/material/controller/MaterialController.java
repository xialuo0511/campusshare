package com.xialuo.campusshare.module.material.controller;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import com.xialuo.campusshare.common.filter.SessionAuthFilter;
import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.module.material.dto.MaterialDownloadResponseDto;
import com.xialuo.campusshare.module.material.dto.MaterialFileUploadResponseDto;
import com.xialuo.campusshare.module.material.dto.MaterialListResponseDto;
import com.xialuo.campusshare.module.material.dto.MaterialOfflineRequestDto;
import com.xialuo.campusshare.module.material.dto.MaterialResponseDto;
import com.xialuo.campusshare.module.material.dto.UploadMaterialRequestDto;
import com.xialuo.campusshare.module.material.service.MaterialFileStorageService;
import com.xialuo.campusshare.module.material.service.MaterialService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.io.IOException;
import java.nio.file.Path;
import java.time.Duration;
import java.util.UUID;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * 资料接口
 */
@RestController
@RequestMapping("/api/v1/materials")
public class MaterialController {
    private static final String MATERIAL_DOWNLOAD_TICKET_PREFIX = "campusshare:material:download-ticket:";
    private static final Duration MATERIAL_DOWNLOAD_TICKET_TTL = Duration.ofMinutes(5);
    /** 资料服务 */
    private final MaterialService materialService;
    /** 文件存储服务 */
    private final MaterialFileStorageService materialFileStorageService;
    private final StringRedisTemplate stringRedisTemplate;

    public MaterialController(
        MaterialService materialService,
        MaterialFileStorageService materialFileStorageService,
        StringRedisTemplate stringRedisTemplate
    ) {
        this.materialService = materialService;
        this.materialFileStorageService = materialFileStorageService;
        this.stringRedisTemplate = stringRedisTemplate;
    }

    /**
     * 上传资料文件
     */
    @PostMapping(value = "/files/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<MaterialFileUploadResponseDto> UploadMaterialFile(
        @RequestParam("file") MultipartFile multipartFile,
        HttpServletRequest httpServletRequest
    ) {
        MaterialFileUploadResponseDto responseDto = materialFileStorageService.UploadMaterialFile(multipartFile);
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
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
     * 查询我的资料
     */
    @GetMapping("/my")
    public ApiResponse<MaterialListResponseDto> ListMyMaterials(
        @RequestParam(value = "pageNo", required = false) Integer pageNo,
        @RequestParam(value = "pageSize", required = false) Integer pageSize,
        @RequestParam(value = "materialStatus", required = false) String materialStatus,
        HttpServletRequest httpServletRequest
    ) {
        MaterialListResponseDto responseDto = materialService.ListMyMaterials(
            GetCurrentUserId(httpServletRequest),
            pageNo,
            pageSize,
            materialStatus
        );
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 查询公开资料
     */
    @GetMapping("/public")
    public ApiResponse<MaterialListResponseDto> ListPublishedMaterials(
        @RequestParam(value = "pageNo", required = false) Integer pageNo,
        @RequestParam(value = "pageSize", required = false) Integer pageSize,
        @RequestParam(value = "keyword", required = false) String keyword,
        @RequestParam(value = "tagKeyword", required = false) String tagKeyword,
        HttpServletRequest httpServletRequest
    ) {
        MaterialListResponseDto responseDto = materialService.ListPublishedMaterials(
            pageNo,
            pageSize,
            keyword,
            tagKeyword
        );
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
        responseDto.SetFileAccessUrl(BuildTicketedFileAccessUrl(responseDto, currentUserId));
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 访问资料文件
     */
    @GetMapping("/{materialId}/files/{fileId:.+}")
    public ResponseEntity<Resource> GetMaterialFile(
        @PathVariable("materialId") Long materialId,
        @PathVariable("fileId") String fileId,
        @RequestParam(value = "ticket", required = false) String ticket,
        HttpServletRequest httpServletRequest
    ) {
        Long currentUserId = GetCurrentUserId(httpServletRequest);
        UserRoleEnum currentUserRole = GetCurrentUserRole(httpServletRequest);
        MaterialResponseDto materialResponseDto = materialService.GetMaterialDetail(
            materialId,
            currentUserId,
            currentUserRole
        );
        if (!fileId.equals(materialResponseDto.GetFileId())) {
            throw new BusinessException(BizCodeEnum.RESOURCE_NOT_FOUND, "文件不存在");
        }

        ValidateMaterialDownloadTicket(ticket, currentUserId, currentUserRole, materialResponseDto);

        Path filePath = materialFileStorageService.GetMaterialFilePath(fileId);
        FileSystemResource fileResource = new FileSystemResource(filePath);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(ResolveMediaType(materialResponseDto.GetFileType()));
        headers.setContentDispositionFormData("attachment", fileId);
        return ResponseEntity.ok()
            .headers(headers)
            .contentLength(ResolveContentLength(materialResponseDto, fileResource))
            .body(fileResource);
    }

    /**
     * 构建短期下载票据地址
     */
    private String BuildTicketedFileAccessUrl(MaterialDownloadResponseDto responseDto, Long currentUserId) {
        String ticket = UUID.randomUUID().toString().replace("-", "");
        String ticketValue = BuildTicketValue(currentUserId, responseDto.GetMaterialId(), responseDto.GetFileId());
        try {
            stringRedisTemplate.opsForValue().set(
                MATERIAL_DOWNLOAD_TICKET_PREFIX + ticket,
                ticketValue,
                MATERIAL_DOWNLOAD_TICKET_TTL
            );
        } catch (Exception exception) {
            throw new BusinessException(BizCodeEnum.SYSTEM_ERROR, "下载票据生成失败，请稍后重试");
        }
        return responseDto.GetFileAccessUrl() + "?ticket=" + ticket;
    }

    private void ValidateMaterialDownloadTicket(
        String ticket,
        Long currentUserId,
        UserRoleEnum currentUserRole,
        MaterialResponseDto materialResponseDto
    ) {
        if (currentUserRole == UserRoleEnum.ADMINISTRATOR) {
            return;
        }
        String safeTicket = ticket == null ? "" : ticket.trim();
        if (safeTicket.isBlank()) {
            throw new BusinessException(BizCodeEnum.FORBIDDEN, "请先完成资料下载授权");
        }
        String ticketValue;
        try {
            ticketValue = stringRedisTemplate.opsForValue().get(MATERIAL_DOWNLOAD_TICKET_PREFIX + safeTicket);
        } catch (Exception exception) {
            throw new BusinessException(BizCodeEnum.SYSTEM_ERROR, "下载票据校验失败，请稍后重试");
        }
        String expectedTicketValue = BuildTicketValue(
            currentUserId,
            materialResponseDto.GetMaterialId(),
            materialResponseDto.GetFileId()
        );
        if (!expectedTicketValue.equals(ticketValue)) {
            throw new BusinessException(BizCodeEnum.FORBIDDEN, "资料下载授权已过期或无效");
        }
    }

    private String BuildTicketValue(Long userId, Long materialId, String fileId) {
        return userId + ":" + materialId + ":" + fileId;
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

    /**
     * 解析媒体类型
     */
    private MediaType ResolveMediaType(String fileType) {
        if (fileType == null || fileType.isBlank()) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
        try {
            return MediaType.parseMediaType(fileType);
        } catch (Exception exception) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }

    /**
     * 解析文件大小
     */
    private long ResolveContentLength(MaterialResponseDto materialResponseDto, FileSystemResource fileResource) {
        if (materialResponseDto.GetFileSizeBytes() != null) {
            return materialResponseDto.GetFileSizeBytes();
        }
        try {
            return fileResource.contentLength();
        } catch (IOException exception) {
            throw new BusinessException(BizCodeEnum.SYSTEM_ERROR, "文件读取失败");
        }
    }
}
