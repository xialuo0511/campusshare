package com.xialuo.campusshare.module.material.service;

import com.xialuo.campusshare.module.material.dto.MaterialFileUploadResponseDto;
import java.nio.file.Path;
import org.springframework.web.multipart.MultipartFile;

/**
 * 资料文件存储服务接口
 */
public interface MaterialFileStorageService {
    /**
     * 上传资料文件
     */
    MaterialFileUploadResponseDto UploadMaterialFile(MultipartFile multipartFile);

    /**
     * 获取资料文件路径
     */
    Path GetMaterialFilePath(String fileId);
}
