package com.xialuo.campusshare.module.resource.service;

import com.xialuo.campusshare.module.resource.dto.ProductImageUploadResponseDto;
import org.springframework.web.multipart.MultipartFile;

/**
 * 商品图片存储服务接口
 */
public interface ProductImageStorageService {
    /**
     * 上传商品图片
     */
    ProductImageUploadResponseDto UploadProductImage(MultipartFile multipartFile);
}
