package com.xialuo.campusshare.module.notification.service.impl;

import com.xialuo.campusshare.entity.NotificationMailTaskEntity;
import com.xialuo.campusshare.entity.UserEntity;
import com.xialuo.campusshare.enums.NotificationTypeEnum;
import com.xialuo.campusshare.module.admin.constant.SystemRuleKeyConstants;
import com.xialuo.campusshare.module.admin.service.SystemRuleConfigService;
import com.xialuo.campusshare.module.notification.mapper.NotificationMailTaskMapper;
import com.xialuo.campusshare.module.notification.service.NotificationMailTaskService;
import com.xialuo.campusshare.module.user.mapper.UserMapper;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 通知邮件任务服务实现
 */
@Service
public class NotificationMailTaskServiceImpl implements NotificationMailTaskService {
    /** 任务状态: 待发送 */
    private static final String DISPATCH_STATUS_PENDING = "PENDING";
    /** 任务状态: 已发送 */
    private static final String DISPATCH_STATUS_SENT = "SENT";
    /** 任务状态: 失败 */
    private static final String DISPATCH_STATUS_FAILED = "FAILED";
    /** 默认最大重试次数 */
    private static final Integer DEFAULT_MAIL_MAX_RETRY = 3;
    /** 默认重试间隔分钟 */
    private static final Integer DEFAULT_MAIL_RETRY_INTERVAL_MINUTES = 15;
    /** 默认批量大小 */
    private static final Integer DEFAULT_MAIL_BATCH_SIZE = 30;
    /** 默认允许发送类型 */
    private static final String DEFAULT_MAIL_TYPE_SCOPE = "ORDER,REVIEW,POINT,TEAM,SYSTEM";

    /** 日志 */
    private static final Logger LOGGER = LoggerFactory.getLogger(NotificationMailTaskServiceImpl.class);

    /** 邮件任务Mapper */
    private final NotificationMailTaskMapper notificationMailTaskMapper;
    /** 用户Mapper */
    private final UserMapper userMapper;
    /** 规则服务 */
    private final SystemRuleConfigService systemRuleConfigService;
    /** 邮件发送器 */
    private final JavaMailSender javaMailSender;
    /** 邮件发件人 */
    private final String mailSenderFrom;
    /** 邮件派发总开关 */
    private final Boolean mailDispatchEnabled;

    public NotificationMailTaskServiceImpl(
        NotificationMailTaskMapper notificationMailTaskMapper,
        UserMapper userMapper,
        SystemRuleConfigService systemRuleConfigService,
        ObjectProvider<JavaMailSender> javaMailSenderProvider,
        @Value("${campusshare.mail.dispatch.from:noreply@campusshare.local}") String mailSenderFrom,
        @Value("${campusshare.mail.dispatch.enabled:true}") Boolean mailDispatchEnabled
    ) {
        this.notificationMailTaskMapper = notificationMailTaskMapper;
        this.userMapper = userMapper;
        this.systemRuleConfigService = systemRuleConfigService;
        this.javaMailSender = javaMailSenderProvider.getIfAvailable();
        this.mailSenderFrom = mailSenderFrom;
        this.mailDispatchEnabled = mailDispatchEnabled;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void CreateMailTask(
        Long receiverUserId,
        NotificationTypeEnum notificationType,
        String mailSubject,
        String mailContent,
        String relatedBizType,
        Long relatedBizId
    ) {
        if (!IsMailEnabled()) {
            return;
        }
        if (receiverUserId == null || notificationType == null) {
            return;
        }
        if (!IsNotificationTypeEnabled(notificationType)) {
            return;
        }
        UserEntity userEntity = userMapper.FindUserById(receiverUserId);
        if (userEntity == null) {
            return;
        }
        String receiverEmail = NormalizeText(userEntity.GetEmail());
        if (receiverEmail.isBlank()) {
            return;
        }

        NotificationMailTaskEntity mailTaskEntity = new NotificationMailTaskEntity();
        mailTaskEntity.SetReceiverUserId(receiverUserId);
        mailTaskEntity.SetReceiverEmail(receiverEmail);
        mailTaskEntity.SetNotificationType(notificationType.name());
        mailTaskEntity.SetMailSubject(NormalizeText(mailSubject));
        mailTaskEntity.SetMailContent(NormalizeText(mailContent));
        mailTaskEntity.SetRelatedBizType(NormalizeText(relatedBizType));
        mailTaskEntity.SetRelatedBizId(relatedBizId);
        mailTaskEntity.SetDispatchStatus(DISPATCH_STATUS_PENDING);
        mailTaskEntity.SetRetryCount(0);
        mailTaskEntity.SetMaxRetryCount(ResolveMaxRetryCount());
        mailTaskEntity.SetNextRetryTime(LocalDateTime.now());
        mailTaskEntity.SetLastFailReason(null);
        mailTaskEntity.SetSendTime(null);
        mailTaskEntity.SetCreateTime(LocalDateTime.now());
        mailTaskEntity.SetUpdateTime(LocalDateTime.now());
        mailTaskEntity.SetDeleted(Boolean.FALSE);
        notificationMailTaskMapper.InsertMailTask(mailTaskEntity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void DispatchPendingMailTasks() {
        if (!IsMailEnabled()) {
            return;
        }
        Integer batchSize = ResolveBatchSize();
        List<NotificationMailTaskEntity> mailTaskList = notificationMailTaskMapper.ListDispatchableTasks(
            DISPATCH_STATUS_PENDING,
            LocalDateTime.now(),
            batchSize
        );
        if (mailTaskList == null || mailTaskList.isEmpty()) {
            return;
        }
        for (NotificationMailTaskEntity mailTaskEntity : mailTaskList) {
            DispatchSingleMailTask(mailTaskEntity);
        }
    }

    /**
     * 派发单个任务
     */
    private void DispatchSingleMailTask(NotificationMailTaskEntity mailTaskEntity) {
        if (mailTaskEntity == null || mailTaskEntity.GetMailTaskId() == null) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        try {
            SendMail(mailTaskEntity);
            notificationMailTaskMapper.MarkDispatchSuccess(mailTaskEntity.GetMailTaskId(), now, now);
        } catch (Exception exception) {
            Integer currentRetryCount = mailTaskEntity.GetRetryCount() == null ? 0 : mailTaskEntity.GetRetryCount();
            Integer nextRetryCount = currentRetryCount + 1;
            Integer maxRetryCount = mailTaskEntity.GetMaxRetryCount() == null
                ? ResolveMaxRetryCount()
                : mailTaskEntity.GetMaxRetryCount();
            String failReason = BuildFailReason(exception);
            if (nextRetryCount >= maxRetryCount) {
                notificationMailTaskMapper.MarkDispatchFailed(
                    mailTaskEntity.GetMailTaskId(),
                    nextRetryCount,
                    failReason,
                    now
                );
                LOGGER.warn("Mail task dispatch failed permanently, mailTaskId={}", mailTaskEntity.GetMailTaskId());
                return;
            }
            LocalDateTime nextRetryTime = now.plusMinutes(ResolveRetryIntervalMinutes());
            notificationMailTaskMapper.UpdateRetryState(
                mailTaskEntity.GetMailTaskId(),
                nextRetryCount,
                nextRetryTime,
                failReason,
                now
            );
        }
    }

    /**
     * 发送邮件
     */
    private void SendMail(NotificationMailTaskEntity mailTaskEntity) {
        if (javaMailSender == null) {
            throw new IllegalStateException("JavaMailSender unavailable");
        }
        SimpleMailMessage mailMessage = new SimpleMailMessage();
        mailMessage.setFrom(mailSenderFrom);
        mailMessage.setTo(mailTaskEntity.GetReceiverEmail());
        mailMessage.setSubject(NormalizeText(mailTaskEntity.GetMailSubject()));
        mailMessage.setText(NormalizeText(mailTaskEntity.GetMailContent()));
        javaMailSender.send(mailMessage);
    }

    /**
     * 是否启用邮件通知
     */
    private boolean IsMailEnabled() {
        if (!Boolean.TRUE.equals(mailDispatchEnabled)) {
            return false;
        }
        Boolean enabled = systemRuleConfigService.GetRuleBooleanValueOrDefault(
            SystemRuleKeyConstants.MAIL_NOTIFICATION_ENABLED,
            Boolean.FALSE
        );
        return Boolean.TRUE.equals(enabled);
    }

    /**
     * 通知类型是否允许邮件发送
     */
    private boolean IsNotificationTypeEnabled(NotificationTypeEnum notificationType) {
        String typeScopeText = systemRuleConfigService.GetRuleValueOrDefault(
            SystemRuleKeyConstants.MAIL_NOTIFICATION_TYPE_SCOPE,
            DEFAULT_MAIL_TYPE_SCOPE
        );
        Set<String> typeScopeSet = Arrays.stream(NormalizeText(typeScopeText).split(","))
            .map(this::NormalizeText)
            .map(item -> item.toUpperCase(Locale.ROOT))
            .filter(item -> !item.isBlank())
            .collect(java.util.stream.Collectors.toSet());
        if (typeScopeSet.isEmpty()) {
            return false;
        }
        return typeScopeSet.contains(notificationType.name());
    }

    /**
     * 解析最大重试次数
     */
    private Integer ResolveMaxRetryCount() {
        Integer maxRetryCount = systemRuleConfigService.GetRuleIntegerValueOrDefault(
            SystemRuleKeyConstants.MAIL_NOTIFICATION_MAX_RETRY,
            DEFAULT_MAIL_MAX_RETRY
        );
        if (maxRetryCount == null || maxRetryCount < 1) {
            return DEFAULT_MAIL_MAX_RETRY;
        }
        return Math.min(maxRetryCount, 10);
    }

    /**
     * 解析重试间隔分钟
     */
    private Integer ResolveRetryIntervalMinutes() {
        Integer retryIntervalMinutes = systemRuleConfigService.GetRuleIntegerValueOrDefault(
            SystemRuleKeyConstants.MAIL_NOTIFICATION_RETRY_INTERVAL_MINUTES,
            DEFAULT_MAIL_RETRY_INTERVAL_MINUTES
        );
        if (retryIntervalMinutes == null || retryIntervalMinutes < 1) {
            return DEFAULT_MAIL_RETRY_INTERVAL_MINUTES;
        }
        return Math.min(retryIntervalMinutes, 120);
    }

    /**
     * 解析批量大小
     */
    private Integer ResolveBatchSize() {
        Integer batchSize = systemRuleConfigService.GetRuleIntegerValueOrDefault(
            SystemRuleKeyConstants.MAIL_NOTIFICATION_BATCH_SIZE,
            DEFAULT_MAIL_BATCH_SIZE
        );
        if (batchSize == null || batchSize < 1) {
            return DEFAULT_MAIL_BATCH_SIZE;
        }
        return Math.min(batchSize, 200);
    }

    /**
     * 构建失败原因
     */
    private String BuildFailReason(Exception exception) {
        if (exception == null || exception.getMessage() == null || exception.getMessage().isBlank()) {
            return "unknown dispatch error";
        }
        String message = exception.getMessage().trim();
        if (message.length() <= 500) {
            return message;
        }
        return message.substring(0, 500);
    }

    /**
     * 文本规范化
     */
    private String NormalizeText(String text) {
        return text == null ? "" : text.trim();
    }
}
