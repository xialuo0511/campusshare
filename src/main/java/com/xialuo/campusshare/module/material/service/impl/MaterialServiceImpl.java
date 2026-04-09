package com.xialuo.campusshare.module.material.service.impl;

import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.entity.StudyMaterialEntity;
import com.xialuo.campusshare.enums.NotificationTypeEnum;
import com.xialuo.campusshare.enums.ResourceStatusEnum;
import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.module.material.dto.MaterialResponseDto;
import com.xialuo.campusshare.module.material.dto.UploadMaterialRequestDto;
import com.xialuo.campusshare.module.material.mapper.StudyMaterialMapper;
import com.xialuo.campusshare.module.material.service.MaterialService;
import com.xialuo.campusshare.module.notification.service.NotificationService;
import com.xialuo.campusshare.module.user.mapper.UserMapper;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 资料服务实现
 */
@Service
public class MaterialServiceImpl implements MaterialService {
    /** 资料业务类型 */
    private static final String MATERIAL_BIZ_TYPE = "MATERIAL";
    /** 资料审核开关 */
    private static final Boolean MATERIAL_REVIEW_REQUIRED = Boolean.TRUE;
    /** 上传奖励积分 */
    private static final Integer MATERIAL_UPLOAD_REWARD_POINTS = 2;
    /** 下载扣减积分 */
    private static final Integer MATERIAL_DOWNLOAD_COST_POINTS = 1;

    /** 资料Mapper */
    private final StudyMaterialMapper studyMaterialMapper;
    /** 用户Mapper */
    private final UserMapper userMapper;
    /** 通知服务 */
    private final NotificationService notificationService;

    public MaterialServiceImpl(
        StudyMaterialMapper studyMaterialMapper,
        UserMapper userMapper,
        NotificationService notificationService
    ) {
        this.studyMaterialMapper = studyMaterialMapper;
        this.userMapper = userMapper;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MaterialResponseDto UploadMaterial(UploadMaterialRequestDto requestDto, Long currentUserId) {
        StudyMaterialEntity materialEntity = new StudyMaterialEntity();
        materialEntity.SetUploaderUserId(currentUserId);
        materialEntity.SetCourseName(requestDto.GetCourseName());
        materialEntity.SetTags(JoinTags(requestDto.GetTags()));
        materialEntity.SetDescription(requestDto.GetDescription());
        materialEntity.SetFileId(requestDto.GetFileId());
        materialEntity.SetFileType(requestDto.GetFileType());
        materialEntity.SetFileSizeBytes(requestDto.GetFileSizeBytes());
        materialEntity.SetMaterialStatus(BuildInitialMaterialStatus());
        materialEntity.SetDownloadCostPoints(MATERIAL_DOWNLOAD_COST_POINTS);
        materialEntity.SetCopyrightDeclared(requestDto.GetCopyrightDeclared());
        materialEntity.SetDownloadCount(0);
        materialEntity.SetCreateTime(LocalDateTime.now());
        materialEntity.SetUpdateTime(LocalDateTime.now());
        materialEntity.SetDeleted(Boolean.FALSE);
        studyMaterialMapper.InsertMaterial(materialEntity);

        SendUploadNotifications(materialEntity, currentUserId);
        return BuildMaterialResponse(materialEntity);
    }

    @Override
    public MaterialResponseDto GetMaterialDetail(Long materialId, Long currentUserId, UserRoleEnum currentUserRole) {
        StudyMaterialEntity materialEntity = GetMaterialById(materialId);
        ValidateMaterialReadable(materialEntity, currentUserId, currentUserRole);
        return BuildMaterialResponse(materialEntity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MaterialResponseDto OfflineMaterial(
        Long materialId,
        Long currentUserId,
        UserRoleEnum currentUserRole,
        String offlineRemark
    ) {
        StudyMaterialEntity materialEntity = GetMaterialById(materialId);
        ValidateMaterialOperable(materialEntity, currentUserId, currentUserRole);
        if (materialEntity.GetMaterialStatus() == ResourceStatusEnum.OFFLINE) {
            throw new BusinessException(BizCodeEnum.MATERIAL_STATUS_INVALID, "资料已下架");
        }

        materialEntity.SetMaterialStatus(ResourceStatusEnum.OFFLINE);
        materialEntity.SetReviewRemark(offlineRemark);
        materialEntity.SetLastReviewTime(LocalDateTime.now());
        materialEntity.SetUpdateTime(LocalDateTime.now());
        studyMaterialMapper.UpdateMaterial(materialEntity);

        if (!currentUserId.equals(materialEntity.GetUploaderUserId())) {
            notificationService.CreateNotification(
                materialEntity.GetUploaderUserId(),
                NotificationTypeEnum.REVIEW,
                "资料已下架",
                "管理员已下架你的资料，请查看处理说明",
                MATERIAL_BIZ_TYPE,
                materialEntity.GetMaterialId()
            );
        }
        return BuildMaterialResponse(materialEntity);
    }

    /**
     * 按ID查询资料
     */
    private StudyMaterialEntity GetMaterialById(Long materialId) {
        StudyMaterialEntity materialEntity = studyMaterialMapper.FindMaterialById(materialId);
        if (materialEntity == null) {
            throw new BusinessException(BizCodeEnum.MATERIAL_NOT_FOUND, "资料不存在");
        }
        return materialEntity;
    }

    /**
     * 构建初始资料状态
     */
    private ResourceStatusEnum BuildInitialMaterialStatus() {
        return Boolean.TRUE.equals(MATERIAL_REVIEW_REQUIRED)
            ? ResourceStatusEnum.PENDING_REVIEW
            : ResourceStatusEnum.PUBLISHED;
    }

    /**
     * 发送上传通知
     */
    private void SendUploadNotifications(StudyMaterialEntity materialEntity, Long currentUserId) {
        if (materialEntity.GetMaterialStatus() == ResourceStatusEnum.PUBLISHED) {
            userMapper.IncreaseUserPointBalance(
                currentUserId,
                MATERIAL_UPLOAD_REWARD_POINTS,
                LocalDateTime.now()
            );
            notificationService.CreateNotification(
                currentUserId,
                NotificationTypeEnum.POINT,
                "资料上传奖励到账",
                "资料已发布，已发放上传积分奖励",
                MATERIAL_BIZ_TYPE,
                materialEntity.GetMaterialId()
            );
            return;
        }
        notificationService.CreateNotification(
            currentUserId,
            NotificationTypeEnum.REVIEW,
            "资料上传成功",
            "资料已提交，等待管理员审核",
            MATERIAL_BIZ_TYPE,
            materialEntity.GetMaterialId()
        );
    }

    /**
     * 校验资料可读权限
     */
    private void ValidateMaterialReadable(
        StudyMaterialEntity materialEntity,
        Long currentUserId,
        UserRoleEnum currentUserRole
    ) {
        if (materialEntity.GetMaterialStatus() == ResourceStatusEnum.PUBLISHED) {
            return;
        }
        if (currentUserRole == UserRoleEnum.ADMINISTRATOR) {
            return;
        }
        if (currentUserId.equals(materialEntity.GetUploaderUserId())) {
            return;
        }
        throw new BusinessException(BizCodeEnum.MATERIAL_PERMISSION_DENIED, "无权查看该资料");
    }

    /**
     * 校验资料可操作权限
     */
    private void ValidateMaterialOperable(
        StudyMaterialEntity materialEntity,
        Long currentUserId,
        UserRoleEnum currentUserRole
    ) {
        if (currentUserRole == UserRoleEnum.ADMINISTRATOR) {
            return;
        }
        if (currentUserId.equals(materialEntity.GetUploaderUserId())) {
            return;
        }
        throw new BusinessException(BizCodeEnum.MATERIAL_PERMISSION_DENIED, "无权操作该资料");
    }

    /**
     * 拼接标签
     */
    private String JoinTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return "";
        }
        return String.join(",", tags);
    }

    /**
     * 拆分标签
     */
    private List<String> SplitTags(String tagsText) {
        if (tagsText == null || tagsText.isBlank()) {
            return new ArrayList<>();
        }
        return Arrays.stream(tagsText.split(","))
            .map(String::trim)
            .filter(item -> !item.isBlank())
            .distinct()
            .toList();
    }

    /**
     * 构建资料响应
     */
    private MaterialResponseDto BuildMaterialResponse(StudyMaterialEntity materialEntity) {
        MaterialResponseDto responseDto = new MaterialResponseDto();
        responseDto.SetMaterialId(materialEntity.GetMaterialId());
        responseDto.SetUploaderUserId(materialEntity.GetUploaderUserId());
        responseDto.SetCourseName(materialEntity.GetCourseName());
        responseDto.SetTags(SplitTags(materialEntity.GetTags()));
        responseDto.SetDescription(materialEntity.GetDescription());
        responseDto.SetFileId(materialEntity.GetFileId());
        responseDto.SetFileType(materialEntity.GetFileType());
        responseDto.SetFileSizeBytes(materialEntity.GetFileSizeBytes());
        responseDto.SetMaterialStatus(materialEntity.GetMaterialStatus());
        responseDto.SetDownloadCostPoints(materialEntity.GetDownloadCostPoints());
        responseDto.SetCopyrightDeclared(materialEntity.GetCopyrightDeclared());
        responseDto.SetDownloadCount(materialEntity.GetDownloadCount());
        responseDto.SetReviewRemark(materialEntity.GetReviewRemark());
        responseDto.SetLastReviewTime(materialEntity.GetLastReviewTime());
        responseDto.SetCreateTime(materialEntity.GetCreateTime());
        return responseDto;
    }
}
