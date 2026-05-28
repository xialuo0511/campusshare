package com.xialuo.campusshare.module.material.controller;

import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.module.material.service.MaterialFileStorageService;
import java.io.IOException;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Locale;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 管理员文件访问接口（用于审核时预览图片，无商品状态限制）
 * 受 SessionAuthFilter 保护，仅 ADMINISTRATOR 角色可访问
 */
@RestController
@RequestMapping("/api/v1/admin/files")
public class AdminFileController {
    /** 文件存储服务 */
    private final MaterialFileStorageService materialFileStorageService;

    public AdminFileController(MaterialFileStorageService materialFileStorageService) {
        this.materialFileStorageService = materialFileStorageService;
    }

    /**
     * 读取图片文件（管理员专用，不校验商品状态）
     */
    @GetMapping("/{fileId:.+}")
    public ResponseEntity<Resource> GetFile(@PathVariable("fileId") String fileId) {
        ValidateImageFileId(fileId);
        Path filePath = materialFileStorageService.GetMaterialFilePath(fileId);
        FileSystemResource fileResource = new FileSystemResource(filePath);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(ResolveMediaType(fileId));
        headers.setContentDisposition(ContentDisposition.inline().filename(fileId).build());
        headers.setCacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePrivate());
        return ResponseEntity.ok()
            .headers(headers)
            .contentLength(ResolveContentLength(fileResource))
            .body(fileResource);
    }

    /**
     * 仅允许访问图片类型文件
     */
    private void ValidateImageFileId(String fileId) {
        String normalized = fileId == null ? "" : fileId.trim();
        if (!IsImageFile(normalized)) {
            throw new BusinessException(BizCodeEnum.FORBIDDEN, "仅支持访问图片文件");
        }
    }

    private boolean IsImageFile(String fileId) {
        String lower = fileId == null ? "" : fileId.trim().toLowerCase(Locale.ROOT);
        return lower.endsWith(".png")
            || lower.endsWith(".jpg")
            || lower.endsWith(".jpeg")
            || lower.endsWith(".webp");
    }

    /**
     * 解析媒体类型
     */
    private MediaType ResolveMediaType(String fileId) {
        String lower = fileId == null ? "" : fileId.trim().toLowerCase(Locale.ROOT);
        if (lower.endsWith(".png")) return MediaType.IMAGE_PNG;
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return MediaType.IMAGE_JPEG;
        return MediaType.APPLICATION_OCTET_STREAM;
    }

    /**
     * 解析文件大小
     */
    private long ResolveContentLength(FileSystemResource fileResource) {
        try {
            return fileResource.contentLength();
        } catch (IOException exception) {
            throw new BusinessException(BizCodeEnum.SYSTEM_ERROR, "文件读取失败");
        }
    }
}
