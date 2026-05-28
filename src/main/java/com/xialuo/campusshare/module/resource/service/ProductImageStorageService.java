package com.xialuo.campusshare.module.resource.service;

import com.xialuo.campusshare.module.resource.dto.ProductImageUploadResponseDto;
import java.nio.file.Path;
import org.springframework.web.multipart.MultipartFile;

/**
 * 商品图片存储服务接口
 */
public interface ProductImageStorageService {
    /**
     * 上传商品图片
     */
    ProductImageUploadResponseDto UploadProductImage(MultipartFile multipartFile);

    /**
     * 获取商品图片文件路径
     */
    Path GetProductImagePath(String fileId);
}
