package com.xialuo.campusshare.module.resource.service.impl;

import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.module.admin.constant.SystemRuleKeyConstants;
import com.xialuo.campusshare.module.admin.service.SystemRuleConfigService;
import com.xialuo.campusshare.module.resource.dto.ProductImageUploadResponseDto;
import com.xialuo.campusshare.module.resource.service.ProductImageStorageService;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * 商品图片存储服务实现
 */
@Service
public class ProductImageStorageServiceImpl implements ProductImageStorageService {
    /** 默认最大图片大小 */
    private static final Integer DEFAULT_IMAGE_MAX_SIZE_MB = 10;
    /** 默认支持图片扩展名 */
    private static final Set<String> DEFAULT_ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png");
    /** 文件ID格式 */
    private static final Pattern FILE_ID_PATTERN = Pattern.compile("^[a-z0-9]{32}\\.[a-z0-9]+$");

    /** 图片存储根目录 */
    private final Path storageRootPath;
    /** 规则服务 */
    private final SystemRuleConfigService systemRuleConfigService;

    public ProductImageStorageServiceImpl(
        @Value("${campusshare.product.image-storage-root:tmp/product-images}") String storageRoot,
        SystemRuleConfigService systemRuleConfigService
    ) {
        this.storageRootPath = Paths.get(storageRoot).toAbsolutePath().normalize();
        this.systemRuleConfigService = systemRuleConfigService;
    }

    @Override
    public ProductImageUploadResponseDto UploadProductImage(MultipartFile multipartFile) {
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
            throw new BusinessException(BizCodeEnum.SYSTEM_ERROR, "图片上传失败，请稍后重试");
        }

        ProductImageUploadResponseDto responseDto = new ProductImageUploadResponseDto();
        responseDto.SetFileId(fileId);
        responseDto.SetFileName(fileName);
        responseDto.SetFileType(fileType);
        responseDto.SetFileSizeBytes(multipartFile.getSize());
        return responseDto;
    }

    private void ValidateMultipartFile(MultipartFile multipartFile) {
        if (multipartFile == null || multipartFile.isEmpty()) {
            throw new BusinessException(BizCodeEnum.PARAM_INVALID, "请选择需要上传的图片");
        }
        Long maxFileSizeBytes = ResolveMaxFileSizeBytes();
        if (multipartFile.getSize() > maxFileSizeBytes) {
            throw new BusinessException(
                BizCodeEnum.PARAM_INVALID,
                "图片大小不能超过" + ResolveMaxFileSizeMegaBytes() + "MB"
            );
        }
    }

    private String ResolveOriginalFileName(MultipartFile multipartFile) {
        String originalFileName = multipartFile.getOriginalFilename();
        if (originalFileName == null || originalFileName.isBlank()) {
            throw new BusinessException(BizCodeEnum.PARAM_INVALID, "文件名不能为空");
        }
        return originalFileName.trim();
    }

    private String ResolveFileExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex <= 0 || dotIndex == fileName.length() - 1) {
            throw new BusinessException(BizCodeEnum.PARAM_INVALID, "图片格式不支持");
        }
        String extension = fileName.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
        if (!DEFAULT_ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BusinessException(BizCodeEnum.PARAM_INVALID, "仅支持 JPG、JPEG、PNG 格式图片");
        }
        return extension;
    }

    private String BuildFileId(String extension) {
        return UUID.randomUUID().toString().replace("-", "") + "." + extension;
    }

    private String ResolveFileType(MultipartFile multipartFile, String extension) {
        String contentType = multipartFile.getContentType();
        if (contentType != null && !contentType.isBlank()) {
            return contentType.trim();
        }
        return "image/" + ("jpg".equals(extension) ? "jpeg" : extension);
    }

    private Path BuildStorageFilePath(String fileId) {
        Path filePath = storageRootPath.resolve(fileId).normalize();
        if (!filePath.startsWith(storageRootPath)) {
            throw new BusinessException(BizCodeEnum.PARAM_INVALID, "文件ID格式错误");
        }
        return filePath;
    }

    private Integer ResolveMaxFileSizeMegaBytes() {
        Integer maxFileSizeMegaBytes = systemRuleConfigService.GetRuleIntegerValueOrDefault(
            SystemRuleKeyConstants.PRODUCT_IMAGE_MAX_SIZE_MB,
            DEFAULT_IMAGE_MAX_SIZE_MB
        );
        if (maxFileSizeMegaBytes == null || maxFileSizeMegaBytes <= 0) {
            return DEFAULT_IMAGE_MAX_SIZE_MB;
        }
        return maxFileSizeMegaBytes;
    }

    private Long ResolveMaxFileSizeBytes() {
        return ResolveMaxFileSizeMegaBytes() * 1024L * 1024L;
    }
}
