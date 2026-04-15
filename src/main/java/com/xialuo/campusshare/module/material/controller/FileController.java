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
 * 文件访问接口
 */
@RestController
@RequestMapping("/api/v1/files")
public class FileController {
    /** 文件存储服务 */
    private final MaterialFileStorageService materialFileStorageService;

    public FileController(MaterialFileStorageService materialFileStorageService) {
        this.materialFileStorageService = materialFileStorageService;
    }

    /**
     * 读取文件
     */
    @GetMapping("/{fileId:.+}")
    public ResponseEntity<Resource> GetFile(@PathVariable("fileId") String fileId) {
        Path filePath = materialFileStorageService.GetMaterialFilePath(fileId);
        FileSystemResource fileResource = new FileSystemResource(filePath);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(ResolveMediaType(fileId));
        headers.setContentDisposition(ContentDisposition.inline().filename(fileId).build());
        headers.setCacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic());
        return ResponseEntity.ok()
            .headers(headers)
            .contentLength(ResolveContentLength(fileResource))
            .body(fileResource);
    }

    /**
     * 解析媒体类型
     */
    private MediaType ResolveMediaType(String fileId) {
        String normalizedFileId = fileId == null ? "" : fileId.trim().toLowerCase(Locale.ROOT);
        if (normalizedFileId.endsWith(".png")) {
            return MediaType.IMAGE_PNG;
        }
        if (normalizedFileId.endsWith(".jpg") || normalizedFileId.endsWith(".jpeg")) {
            return MediaType.IMAGE_JPEG;
        }
        if (normalizedFileId.endsWith(".pdf")) {
            return MediaType.APPLICATION_PDF;
        }
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

