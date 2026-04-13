package com.xialuo.campusshare.module.material.service.impl;

import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.module.material.dto.MaterialFileUploadResponseDto;
import com.xialuo.campusshare.module.material.service.MaterialFileStorageService;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * 资料文件存储服务实现
 */
@Service
public class MaterialFileStorageServiceImpl implements MaterialFileStorageService {
    /** 最大文件大小 */
    private static final long MAX_FILE_SIZE_BYTES = 25L * 1024L * 1024L;
    /** 支持的扩展名 */
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "pdf");
    /** 文件ID格式 */
    private static final Pattern FILE_ID_PATTERN = Pattern.compile("^[a-z0-9]{32}\\.(jpg|jpeg|png|pdf)$");

    /** 文件根目录 */
    private final Path storageRootPath;

    public MaterialFileStorageServiceImpl(
        @Value("${campusshare.material.storage-root:tmp/material-files}") String storageRoot
    ) {
        this.storageRootPath = Paths.get(storageRoot).toAbsolutePath().normalize();
    }

    @Override
    public MaterialFileUploadResponseDto UploadMaterialFile(MultipartFile multipartFile) {
        ValidateMultipartFile(multipartFile);
        String fileName = ResolveOriginalFileName(multipartFile);
        String extension = ResolveFileExtension(fileName);
        String fileId = BuildFileId(extension);
        String fileType = ResolveFileType(multipartFile, extension);
        Path targetFilePath = BuildStorageFilePath(fileId);

        try {
            Files.createDirectories(storageRootPath);
            try (InputStream fileInputStream = multipartFile.getInputStream()) {
                Files.copy(fileInputStream, targetFilePath, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException exception) {
            throw new BusinessException(BizCodeEnum.SYSTEM_ERROR, "文件上传失败，请稍后重试");
        }

        MaterialFileUploadResponseDto responseDto = new MaterialFileUploadResponseDto();
        responseDto.SetFileId(fileId);
        responseDto.SetFileName(fileName);
        responseDto.SetFileType(fileType);
        responseDto.SetFileSizeBytes(multipartFile.getSize());
        return responseDto;
    }

    @Override
    public Path GetMaterialFilePath(String fileId) {
        ValidateFileId(fileId);
        Path filePath = BuildStorageFilePath(fileId);
        if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            throw new BusinessException(BizCodeEnum.RESOURCE_NOT_FOUND, "文件不存在");
        }
        return filePath;
    }

    /**
     * 校验上传文件
     */
    private void ValidateMultipartFile(MultipartFile multipartFile) {
        if (multipartFile == null || multipartFile.isEmpty()) {
            throw new BusinessException(BizCodeEnum.PARAM_INVALID, "请选择需要上传的文件");
        }
        if (multipartFile.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BusinessException(BizCodeEnum.PARAM_INVALID, "文件大小不能超过25MB");
        }
    }

    /**
     * 校验文件ID
     */
    private void ValidateFileId(String fileId) {
        String normalizedFileId = fileId == null ? "" : fileId.trim().toLowerCase(Locale.ROOT);
        if (!FILE_ID_PATTERN.matcher(normalizedFileId).matches()) {
            throw new BusinessException(BizCodeEnum.PARAM_INVALID, "文件ID格式错误");
        }
    }

    /**
     * 构建文件路径
     */
    private Path BuildStorageFilePath(String fileId) {
        Path filePath = storageRootPath.resolve(fileId).normalize();
        if (!filePath.startsWith(storageRootPath)) {
            throw new BusinessException(BizCodeEnum.PARAM_INVALID, "文件ID格式错误");
        }
        return filePath;
    }

    /**
     * 解析原始文件名
     */
    private String ResolveOriginalFileName(MultipartFile multipartFile) {
        String originalFileName = multipartFile.getOriginalFilename();
        if (originalFileName == null || originalFileName.isBlank()) {
            throw new BusinessException(BizCodeEnum.PARAM_INVALID, "文件名不能为空");
        }
        return originalFileName.trim();
    }

    /**
     * 解析文件扩展名
     */
    private String ResolveFileExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex <= 0 || dotIndex == fileName.length() - 1) {
            throw new BusinessException(BizCodeEnum.PARAM_INVALID, "文件格式不支持");
        }
        String extension = fileName.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BusinessException(BizCodeEnum.PARAM_INVALID, "仅支持 JPG、PNG、PDF 文件");
        }
        return extension;
    }

    /**
     * 生成文件ID
     */
    private String BuildFileId(String extension) {
        return UUID.randomUUID().toString().replace("-", "") + "." + extension;
    }

    /**
     * 解析文件类型
     */
    private String ResolveFileType(MultipartFile multipartFile, String extension) {
        String contentType = multipartFile.getContentType();
        if (contentType != null && !contentType.isBlank()) {
            return contentType.trim();
        }
        if ("pdf".equals(extension)) {
            return "application/pdf";
        }
        return "image/" + ("jpg".equals(extension) ? "jpeg" : extension);
    }
}
