package com.xialuo.campusshare.module.material.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.service.ContentModerationService;
import com.xialuo.campusshare.entity.StudyMaterialEntity;
import com.xialuo.campusshare.entity.UserEntity;
import com.xialuo.campusshare.enums.NotificationTypeEnum;
import com.xialuo.campusshare.enums.ResourceStatusEnum;
import com.xialuo.campusshare.module.admin.constant.SystemRuleKeyConstants;
import com.xialuo.campusshare.module.admin.service.SystemRuleConfigService;
import com.xialuo.campusshare.module.material.dto.MaterialDownloadResponseDto;
import com.xialuo.campusshare.module.material.mapper.StudyMaterialMapper;
import com.xialuo.campusshare.module.notification.service.NotificationService;
import com.xialuo.campusshare.module.point.service.PointLedgerService;
import com.xialuo.campusshare.module.user.mapper.UserMapper;
import org.junit.jupiter.api.Test;

/**
 * Material service tests.
 */
class MaterialServiceImplTest {

    @Test
    void DownloadMaterialShouldDeductPointsForUploaderDownload() {
        StudyMaterialMapper studyMaterialMapper = mock(StudyMaterialMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        NotificationService notificationService = mock(NotificationService.class);
        PointLedgerService pointLedgerService = mock(PointLedgerService.class);
        SystemRuleConfigService systemRuleConfigService = mock(SystemRuleConfigService.class);
        ContentModerationService contentModerationService = mock(ContentModerationService.class);
        MaterialServiceImpl service = new MaterialServiceImpl(
            studyMaterialMapper,
            userMapper,
            notificationService,
            pointLedgerService,
            systemRuleConfigService,
            contentModerationService
        );

        StudyMaterialEntity materialEntity = BuildPublishedMaterial(10L, 1001L, 0, 3);
        StudyMaterialEntity latestMaterialEntity = BuildPublishedMaterial(10L, 1001L, 0, 4);
        UserEntity userEntity = new UserEntity();
        userEntity.SetUserId(1001L);
        userEntity.SetPointBalance(7);

        when(studyMaterialMapper.FindMaterialById(10L)).thenReturn(materialEntity, latestMaterialEntity);
        when(systemRuleConfigService.GetRuleIntegerValueOrDefault(
            eq(SystemRuleKeyConstants.MATERIAL_DOWNLOAD_COST_POINTS),
            eq(1)
        )).thenReturn(2);
        when(studyMaterialMapper.IncreaseDownloadCount(eq(10L), any())).thenReturn(1);
        when(userMapper.FindUserById(1001L)).thenReturn(userEntity);

        MaterialDownloadResponseDto responseDto = service.DownloadMaterial(10L, 1001L);

        verify(pointLedgerService, times(1)).RecordDownloadCost(
            eq(1001L),
            eq(2),
            eq("MATERIAL"),
            eq(10L),
            eq("资料下载扣减")
        );
        verify(notificationService, times(1)).CreateNotification(
            eq(1001L),
            eq(NotificationTypeEnum.POINT),
            eq("资料下载成功"),
            eq("本次下载扣减积分：2；文件ID：material-file.pdf"),
            eq("MATERIAL"),
            eq(10L)
        );
        assertEquals(2, responseDto.GetDeductedPoints());
        assertEquals(7, responseDto.GetCurrentPointBalance());
        assertEquals(4, responseDto.GetDownloadCount());
    }

    @Test
    void DownloadMaterialShouldNotIncreaseCountWhenPointDeductionFails() {
        StudyMaterialMapper studyMaterialMapper = mock(StudyMaterialMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        NotificationService notificationService = mock(NotificationService.class);
        PointLedgerService pointLedgerService = mock(PointLedgerService.class);
        SystemRuleConfigService systemRuleConfigService = mock(SystemRuleConfigService.class);
        ContentModerationService contentModerationService = mock(ContentModerationService.class);
        MaterialServiceImpl service = new MaterialServiceImpl(
            studyMaterialMapper,
            userMapper,
            notificationService,
            pointLedgerService,
            systemRuleConfigService,
            contentModerationService
        );

        StudyMaterialEntity materialEntity = BuildPublishedMaterial(10L, 1001L, 3, 3);
        when(studyMaterialMapper.FindMaterialById(10L)).thenReturn(materialEntity);
        doThrow(new BusinessException(BizCodeEnum.POINT_BALANCE_INSUFFICIENT, "point not enough"))
            .when(pointLedgerService)
            .RecordDownloadCost(eq(2002L), eq(3), eq("MATERIAL"), eq(10L), anyString());

        assertThrows(BusinessException.class, () -> service.DownloadMaterial(10L, 2002L));
        verify(studyMaterialMapper, never()).IncreaseDownloadCount(anyLong(), any());
        verify(notificationService, never()).CreateNotification(anyLong(), any(), anyString(), anyString(), anyString(), anyLong());
    }

    @Test
    void DownloadMaterialShouldRejectUnpublishedMaterial() {
        StudyMaterialMapper studyMaterialMapper = mock(StudyMaterialMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        NotificationService notificationService = mock(NotificationService.class);
        PointLedgerService pointLedgerService = mock(PointLedgerService.class);
        SystemRuleConfigService systemRuleConfigService = mock(SystemRuleConfigService.class);
        ContentModerationService contentModerationService = mock(ContentModerationService.class);
        MaterialServiceImpl service = new MaterialServiceImpl(
            studyMaterialMapper,
            userMapper,
            notificationService,
            pointLedgerService,
            systemRuleConfigService,
            contentModerationService
        );

        StudyMaterialEntity materialEntity = BuildPublishedMaterial(10L, 1001L, 3, 3);
        materialEntity.SetMaterialStatus(ResourceStatusEnum.PENDING_REVIEW);
        when(studyMaterialMapper.FindMaterialById(10L)).thenReturn(materialEntity);

        assertThrows(BusinessException.class, () -> service.DownloadMaterial(10L, 2002L));
        verify(pointLedgerService, never()).RecordDownloadCost(anyLong(), any(), anyString(), anyLong(), anyString());
        verify(studyMaterialMapper, never()).IncreaseDownloadCount(anyLong(), any());
    }

    private StudyMaterialEntity BuildPublishedMaterial(
        Long materialId,
        Long uploaderUserId,
        Integer downloadCostPoints,
        Integer downloadCount
    ) {
        StudyMaterialEntity materialEntity = new StudyMaterialEntity();
        materialEntity.SetMaterialId(materialId);
        materialEntity.SetUploaderUserId(uploaderUserId);
        materialEntity.SetFileId("material-file.pdf");
        materialEntity.SetMaterialStatus(ResourceStatusEnum.PUBLISHED);
        materialEntity.SetDownloadCostPoints(downloadCostPoints);
        materialEntity.SetDownloadCount(downloadCount);
        return materialEntity;
    }
}
