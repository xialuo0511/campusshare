package com.xialuo.campusshare.module.material.service;

import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.module.material.dto.MaterialResponseDto;
import com.xialuo.campusshare.module.material.dto.UploadMaterialRequestDto;

/**
 * 资料服务接口
 */
public interface MaterialService {
    /**
     * 上传资料
     */
    MaterialResponseDto UploadMaterial(UploadMaterialRequestDto requestDto, Long currentUserId);

    /**
     * 查询资料详情
     */
    MaterialResponseDto GetMaterialDetail(Long materialId, Long currentUserId, UserRoleEnum currentUserRole);

    /**
     * 下架资料
     */
    MaterialResponseDto OfflineMaterial(
        Long materialId,
        Long currentUserId,
        UserRoleEnum currentUserRole,
        String offlineRemark
    );
}
