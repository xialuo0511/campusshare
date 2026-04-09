package com.xialuo.campusshare.module.notification.service.impl;

import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.entity.NotificationEntity;
import com.xialuo.campusshare.enums.NotificationTypeEnum;
import com.xialuo.campusshare.module.notification.dto.NotificationResponseDto;
import com.xialuo.campusshare.module.notification.mapper.NotificationMapper;
import com.xialuo.campusshare.module.notification.service.NotificationService;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 通知服务实现
 */
@Service
public class NotificationServiceImpl implements NotificationService {
    /** 通知Mapper */
    private final NotificationMapper notificationMapper;

    public NotificationServiceImpl(NotificationMapper notificationMapper) {
        this.notificationMapper = notificationMapper;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void CreateNotification(
        Long receiverUserId,
        NotificationTypeEnum notificationType,
        String title,
        String content,
        String relatedBizType,
        Long relatedBizId
    ) {
        if (receiverUserId == null) {
            return;
        }

        NotificationEntity notificationEntity = new NotificationEntity();
        notificationEntity.SetReceiverUserId(receiverUserId);
        notificationEntity.SetNotificationType(notificationType);
        notificationEntity.SetTitle(title);
        notificationEntity.SetContent(content);
        notificationEntity.SetRelatedBizType(relatedBizType);
        notificationEntity.SetRelatedBizId(relatedBizId);
        notificationEntity.SetReadFlag(Boolean.FALSE);
        notificationEntity.SetSendTime(LocalDateTime.now());
        notificationEntity.SetCreateTime(LocalDateTime.now());
        notificationEntity.SetUpdateTime(LocalDateTime.now());
        notificationEntity.SetDeleted(Boolean.FALSE);
        notificationMapper.InsertNotification(notificationEntity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void BatchCreateNotification(
        List<Long> receiverUserIds,
        NotificationTypeEnum notificationType,
        String title,
        String content,
        String relatedBizType,
        Long relatedBizId
    ) {
        if (receiverUserIds == null || receiverUserIds.isEmpty()) {
            return;
        }
        for (Long receiverUserId : receiverUserIds) {
            CreateNotification(receiverUserId, notificationType, title, content, relatedBizType, relatedBizId);
        }
    }

    @Override
    public List<NotificationResponseDto> ListUserNotifications(Long receiverUserId) {
        if (receiverUserId == null) {
            return Collections.emptyList();
        }
        return notificationMapper.ListNotificationsByReceiverUserId(receiverUserId).stream()
            .map(this::BuildNotificationResponse)
            .toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public NotificationResponseDto MarkNotificationRead(Long notificationId, Long receiverUserId) {
        NotificationEntity notificationEntity = notificationMapper.FindNotificationById(notificationId);
        if (notificationEntity == null) {
            throw new BusinessException(BizCodeEnum.RESOURCE_NOT_FOUND, "通知不存在");
        }
        if (!receiverUserId.equals(notificationEntity.GetReceiverUserId())) {
            throw new BusinessException(BizCodeEnum.FORBIDDEN, "无权操作该通知");
        }

        notificationEntity.SetReadFlag(Boolean.TRUE);
        notificationEntity.SetUpdateTime(LocalDateTime.now());
        notificationMapper.UpdateNotification(notificationEntity);
        return BuildNotificationResponse(notificationEntity);
    }

    /**
     * 构建通知响应
     */
    private NotificationResponseDto BuildNotificationResponse(NotificationEntity notificationEntity) {
        NotificationResponseDto responseDto = new NotificationResponseDto();
        responseDto.SetNotificationId(notificationEntity.GetNotificationId());
        responseDto.SetReceiverUserId(notificationEntity.GetReceiverUserId());
        responseDto.SetNotificationType(notificationEntity.GetNotificationType());
        responseDto.SetTitle(notificationEntity.GetTitle());
        responseDto.SetContent(notificationEntity.GetContent());
        responseDto.SetRelatedBizType(notificationEntity.GetRelatedBizType());
        responseDto.SetRelatedBizId(notificationEntity.GetRelatedBizId());
        responseDto.SetReadFlag(notificationEntity.GetReadFlag());
        responseDto.SetSendTime(notificationEntity.GetSendTime());
        return responseDto;
    }
}
