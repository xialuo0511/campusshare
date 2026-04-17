package com.xialuo.campusshare.module.governance.service.impl;

import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.entity.CommentEntity;
import com.xialuo.campusshare.entity.ProductEntity;
import com.xialuo.campusshare.entity.ReportEntity;
import com.xialuo.campusshare.entity.StudyMaterialEntity;
import com.xialuo.campusshare.entity.UserEntity;
import com.xialuo.campusshare.enums.NotificationTypeEnum;
import com.xialuo.campusshare.enums.ResourceStatusEnum;
import com.xialuo.campusshare.enums.ReportStatusEnum;
import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.enums.UserStatusEnum;
import com.xialuo.campusshare.module.governance.dto.ReportResponseDto;
import com.xialuo.campusshare.module.governance.dto.ReportReviewRequestDto;
import com.xialuo.campusshare.module.governance.enums.ReportDispositionActionEnum;
import com.xialuo.campusshare.module.governance.dto.SubmitReportRequestDto;
import com.xialuo.campusshare.module.governance.enums.ReportTargetTypeEnum;
import com.xialuo.campusshare.module.governance.mapper.CommentMapper;
import com.xialuo.campusshare.module.governance.mapper.ReportMapper;
import com.xialuo.campusshare.module.governance.service.ReportService;
import com.xialuo.campusshare.module.material.mapper.StudyMaterialMapper;
import com.xialuo.campusshare.module.notification.service.NotificationService;
import com.xialuo.campusshare.module.order.mapper.OrderMapper;
import com.xialuo.campusshare.module.resource.mapper.ProductMapper;
import com.xialuo.campusshare.module.user.mapper.UserMapper;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 举报服务实现
 */
@Service
public class ReportServiceImpl implements ReportService {
    /** 举报业务类型 */
    private static final String REPORT_BIZ_TYPE = "REPORT";
    /** 详情长度上限 */
    private static final Integer REPORT_DETAIL_MAX_LENGTH = 500;
    /** 证据文件长度上限 */
    private static final Integer REPORT_EVIDENCE_MAX_LENGTH = 500;

    /** 举报Mapper */
    private final ReportMapper reportMapper;
    /** 评论Mapper */
    private final CommentMapper commentMapper;
    /** 通知服务 */
    private final NotificationService notificationService;
    /** 用户Mapper */
    private final UserMapper userMapper;
    /** 商品Mapper */
    private final ProductMapper productMapper;
    /** 资料Mapper */
    private final StudyMaterialMapper studyMaterialMapper;
    /** 订单Mapper */
    private final OrderMapper orderMapper;

    public ReportServiceImpl(
        ReportMapper reportMapper,
        CommentMapper commentMapper,
        NotificationService notificationService,
        UserMapper userMapper,
        ProductMapper productMapper,
        StudyMaterialMapper studyMaterialMapper,
        OrderMapper orderMapper
    ) {
        this.reportMapper = reportMapper;
        this.commentMapper = commentMapper;
        this.notificationService = notificationService;
        this.userMapper = userMapper;
        this.productMapper = productMapper;
        this.studyMaterialMapper = studyMaterialMapper;
        this.orderMapper = orderMapper;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReportResponseDto SubmitReport(SubmitReportRequestDto requestDto, Long reporterUserId) {
        ValidateReportTargetExists(requestDto.GetTargetType(), requestDto.GetTargetId());

        ReportEntity pendingReportEntity = reportMapper.FindPendingReportByTarget(
            requestDto.GetTargetType(),
            requestDto.GetTargetId(),
            requestDto.GetReasonCategory()
        );
        if (pendingReportEntity != null) {
            MergePendingReport(pendingReportEntity, requestDto, reporterUserId);
            reportMapper.UpdateReport(pendingReportEntity);
            SendReportPendingNotification(pendingReportEntity.GetReportId(), Boolean.TRUE);
            return BuildReportResponse(pendingReportEntity);
        }

        ReportEntity reportEntity = new ReportEntity();
        reportEntity.SetReporterUserId(reporterUserId);
        reportEntity.SetTargetType(requestDto.GetTargetType());
        reportEntity.SetTargetId(requestDto.GetTargetId());
        reportEntity.SetReasonCategory(requestDto.GetReasonCategory());
        reportEntity.SetDetail(requestDto.GetDetail());
        reportEntity.SetEvidenceFileIds(JoinEvidenceFileIds(requestDto.GetEvidenceFileIds()));
        reportEntity.SetReportStatus(ReportStatusEnum.PENDING_REVIEW);
        reportEntity.SetCreateTime(LocalDateTime.now());
        reportEntity.SetUpdateTime(LocalDateTime.now());
        reportEntity.SetDeleted(Boolean.FALSE);
        reportMapper.InsertReport(reportEntity);
        SendReportPendingNotification(reportEntity.GetReportId(), Boolean.FALSE);
        return BuildReportResponse(reportEntity);
    }

    /**
     * 发送待处理通知
     */
    private void SendReportPendingNotification(Long reportId, Boolean merged) {
        List<Long> adminUserIdList = userMapper.ListActiveAdministratorUserIds();
        notificationService.BatchCreateNotification(
            adminUserIdList,
            NotificationTypeEnum.REVIEW,
            Boolean.TRUE.equals(merged) ? "举报追加待处理" : "新举报待处理",
            Boolean.TRUE.equals(merged) ? "同对象举报已合并，请及时审核" : "收到新的举报单，请及时审核",
            REPORT_BIZ_TYPE,
            reportId
        );
    }

    @Override
    public ReportResponseDto GetReportDetail(Long reportId, Long currentUserId, UserRoleEnum currentUserRole) {
        ReportEntity reportEntity = GetReportById(reportId);
        ValidateReportReadable(reportEntity, currentUserId, currentUserRole);
        return BuildReportResponse(reportEntity);
    }

    @Override
    public List<ReportResponseDto> ListPendingReports() {
        return reportMapper.ListPendingReports().stream()
            .map(this::BuildReportResponse)
            .toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReportResponseDto ReviewReport(Long reportId, ReportReviewRequestDto requestDto, Long adminUserId) {
        ReportEntity reportEntity = GetReportById(reportId);
        if (reportEntity.GetReportStatus() != ReportStatusEnum.PENDING_REVIEW) {
            throw new BusinessException(BizCodeEnum.REPORT_STATUS_INVALID, "当前状态不允许审核");
        }

        ReportStatusEnum reviewResultStatus = Boolean.TRUE.equals(requestDto.GetApproved())
            ? ReportStatusEnum.APPROVED
            : ReportStatusEnum.REJECTED;
        ReportDispositionActionEnum dispositionActionEnum = ResolveDispositionAction(reportEntity, requestDto);
        if (reviewResultStatus == ReportStatusEnum.APPROVED) {
            ExecuteDispositionAction(reportEntity, dispositionActionEnum);
        }

        reportEntity.SetReportStatus(ReportStatusEnum.CLOSED);
        reportEntity.SetReviewResultStatus(reviewResultStatus);
        reportEntity.SetDispositionAction(dispositionActionEnum.name());
        reportEntity.SetReviewerAdminId(adminUserId);
        reportEntity.SetReviewRemark(requestDto.GetReviewRemark());
        reportEntity.SetReviewTime(LocalDateTime.now());
        reportEntity.SetCloseTime(LocalDateTime.now());
        reportEntity.SetUpdateTime(LocalDateTime.now());
        reportMapper.UpdateReport(reportEntity);

        notificationService.CreateNotification(
            reportEntity.GetReporterUserId(),
            NotificationTypeEnum.REVIEW,
            "举报处理完成",
            BuildReportResultMessage(reviewResultStatus),
            REPORT_BIZ_TYPE,
            reportEntity.GetReportId()
        );
        return BuildReportResponse(reportEntity);
    }

    /**
     * 合并待处理举报
     */
    private void MergePendingReport(
        ReportEntity pendingReportEntity,
        SubmitReportRequestDto requestDto,
        Long reporterUserId
    ) {
        pendingReportEntity.SetDetail(
            MergeDetail(
                pendingReportEntity.GetDetail(),
                requestDto.GetDetail(),
                reporterUserId
            )
        );
        pendingReportEntity.SetEvidenceFileIds(
            MergeEvidenceFileIds(
                pendingReportEntity.GetEvidenceFileIds(),
                requestDto.GetEvidenceFileIds()
            )
        );
        pendingReportEntity.SetUpdateTime(LocalDateTime.now());
    }

    /**
     * 校验举报对象存在
     */
    private void ValidateReportTargetExists(ReportTargetTypeEnum targetType, Long targetId) {
        boolean targetExists = switch (targetType) {
            case USER -> userMapper.FindUserById(targetId) != null;
            case RESOURCE -> productMapper.FindProductById(targetId) != null
                || studyMaterialMapper.FindMaterialById(targetId) != null;
            case COMMENT -> {
                Long count = commentMapper.CountCommentById(targetId);
                yield count != null && count > 0;
            }
        };
        if (!targetExists) {
            throw new BusinessException(BizCodeEnum.RESOURCE_NOT_FOUND, "举报对象不存在");
        }
    }

    /**
     * 按ID查询举报
     */
    private ReportEntity GetReportById(Long reportId) {
        ReportEntity reportEntity = reportMapper.FindReportById(reportId);
        if (reportEntity == null) {
            throw new BusinessException(BizCodeEnum.REPORT_NOT_FOUND, "举报不存在");
        }
        return reportEntity;
    }

    /**
     * 校验举报可读权限
     */
    private void ValidateReportReadable(ReportEntity reportEntity, Long currentUserId, UserRoleEnum currentUserRole) {
        if (currentUserRole == UserRoleEnum.ADMINISTRATOR) {
            return;
        }
        if (currentUserId.equals(reportEntity.GetReporterUserId())) {
            return;
        }
        throw new BusinessException(BizCodeEnum.REPORT_PERMISSION_DENIED, "无权查看该举报");
    }

    /**
     * 拼接证据文件ID
     */
    private String JoinEvidenceFileIds(List<String> evidenceFileIds) {
        if (evidenceFileIds == null || evidenceFileIds.isEmpty()) {
            return "";
        }
        return BuildEvidenceText(new LinkedHashSet<>(evidenceFileIds));
    }

    /**
     * 拆分证据文件ID
     */
    private List<String> SplitEvidenceFileIds(String evidenceFileIds) {
        if (evidenceFileIds == null || evidenceFileIds.isBlank()) {
            return new ArrayList<>();
        }
        return Arrays.stream(evidenceFileIds.split(","))
            .map(String::trim)
            .filter(item -> !item.isBlank())
            .distinct()
            .toList();
    }

    /**
     * 合并详情
     */
    private String MergeDetail(String currentDetail, String appendDetail, Long reporterUserId) {
        if (appendDetail == null || appendDetail.isBlank()) {
            return TruncateText(currentDetail, REPORT_DETAIL_MAX_LENGTH);
        }
        String appendText = "追加举报(用户ID:" + reporterUserId + "): " + appendDetail.trim();
        if (currentDetail == null || currentDetail.isBlank()) {
            return TruncateText(appendText, REPORT_DETAIL_MAX_LENGTH);
        }
        String mergedDetail = currentDetail.trim() + "\n" + appendText;
        return TruncateText(mergedDetail, REPORT_DETAIL_MAX_LENGTH);
    }

    /**
     * 合并证据
     */
    private String MergeEvidenceFileIds(String currentEvidenceText, List<String> appendEvidenceList) {
        Set<String> mergedEvidenceSet = new LinkedHashSet<>(SplitEvidenceFileIds(currentEvidenceText));
        if (appendEvidenceList != null) {
            for (String evidence : appendEvidenceList) {
                if (evidence == null || evidence.isBlank()) {
                    continue;
                }
                mergedEvidenceSet.add(evidence.trim());
            }
        }
        return BuildEvidenceText(mergedEvidenceSet);
    }

    /**
     * 构建证据文本
     */
    private String BuildEvidenceText(Set<String> evidenceSet) {
        StringBuilder evidenceBuilder = new StringBuilder();
        for (String evidence : evidenceSet) {
            if (evidence == null || evidence.isBlank()) {
                continue;
            }
            if (evidenceBuilder.length() == 0) {
                if (evidence.length() > REPORT_EVIDENCE_MAX_LENGTH) {
                    evidenceBuilder.append(evidence, 0, REPORT_EVIDENCE_MAX_LENGTH);
                    break;
                }
                evidenceBuilder.append(evidence);
                continue;
            }
            if (evidenceBuilder.length() + 1 + evidence.length() > REPORT_EVIDENCE_MAX_LENGTH) {
                break;
            }
            evidenceBuilder.append(",").append(evidence);
        }
        return evidenceBuilder.toString();
    }

    /**
     * 截断文本
     */
    private String TruncateText(String text, Integer maxLength) {
        if (text == null || text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength);
    }

    /**
     * 构建结果消息
     */
    private String BuildReportResultMessage(ReportStatusEnum reviewResultStatus) {
        if (reviewResultStatus == ReportStatusEnum.APPROVED) {
            return "举报已核实并完成处置";
        }
        return "举报已处理，当前结论为驳回";
    }

    /**
     * 解析处置动作
     */
    private ReportDispositionActionEnum ResolveDispositionAction(
        ReportEntity reportEntity,
        ReportReviewRequestDto requestDto
    ) {
        if (!Boolean.TRUE.equals(requestDto.GetApproved())) {
            return ReportDispositionActionEnum.NONE;
        }
        ReportDispositionActionEnum dispositionActionEnum = ReportDispositionActionEnum.ResolveFromText(
            requestDto.GetDispositionAction()
        );
        if (dispositionActionEnum == null) {
            dispositionActionEnum = ResolveDefaultDispositionAction(reportEntity.GetTargetType());
        }
        ValidateDispositionAction(reportEntity.GetTargetType(), dispositionActionEnum);
        return dispositionActionEnum;
    }

    /**
     * 执行处置动作
     */
    private void ExecuteDispositionAction(ReportEntity reportEntity, ReportDispositionActionEnum dispositionActionEnum) {
        switch (dispositionActionEnum) {
            case NONE, KEEP -> {
                return;
            }
            case HIDE_COMMENT -> HideComment(reportEntity.GetTargetId());
            case OFFLINE_RESOURCE -> OfflineResource(reportEntity.GetTargetId());
            case FREEZE_USER -> FreezeUser(reportEntity.GetTargetId());
            default -> throw new BusinessException(BizCodeEnum.REPORT_DISPOSITION_ACTION_INVALID, "不支持的处置动作");
        }
    }

    /**
     * 默认处置动作
     */
    private ReportDispositionActionEnum ResolveDefaultDispositionAction(ReportTargetTypeEnum targetType) {
        return switch (targetType) {
            case COMMENT -> ReportDispositionActionEnum.HIDE_COMMENT;
            case USER -> ReportDispositionActionEnum.FREEZE_USER;
            case RESOURCE -> ReportDispositionActionEnum.OFFLINE_RESOURCE;
        };
    }

    /**
     * 校验动作与对象匹配
     */
    private void ValidateDispositionAction(ReportTargetTypeEnum targetType, ReportDispositionActionEnum dispositionActionEnum) {
        if (dispositionActionEnum == ReportDispositionActionEnum.NONE || dispositionActionEnum == ReportDispositionActionEnum.KEEP) {
            return;
        }
        boolean matched = switch (targetType) {
            case COMMENT -> dispositionActionEnum == ReportDispositionActionEnum.HIDE_COMMENT;
            case USER -> dispositionActionEnum == ReportDispositionActionEnum.FREEZE_USER;
            case RESOURCE -> dispositionActionEnum == ReportDispositionActionEnum.OFFLINE_RESOURCE;
        };
        if (!matched) {
            throw new BusinessException(BizCodeEnum.REPORT_DISPOSITION_ACTION_INVALID, "处置动作与举报对象不匹配");
        }
    }

    /**
     * 隐藏评论
     */
    private void HideComment(Long commentId) {
        Integer updatedRows = commentMapper.HideComment(commentId, LocalDateTime.now());
        if (updatedRows != null && updatedRows > 0) {
            return;
        }
        CommentEntity commentEntity = commentMapper.FindCommentById(commentId);
        if (commentEntity == null) {
            throw new BusinessException(BizCodeEnum.RESOURCE_NOT_FOUND, "评论不存在");
        }
        if (!Boolean.TRUE.equals(commentEntity.GetHiddenFlag())) {
            throw new BusinessException(BizCodeEnum.SYSTEM_ERROR, "隐藏评论失败");
        }
    }

    /**
     * 下架资源
     */
    private void OfflineResource(Long targetId) {
        if (TryOfflineProduct(targetId)) {
            return;
        }
        StudyMaterialEntity materialEntity = studyMaterialMapper.FindMaterialById(targetId);
        if (materialEntity == null) {
            throw new BusinessException(BizCodeEnum.RESOURCE_NOT_FOUND, "资源不存在");
        }
        if (materialEntity.GetMaterialStatus() != ResourceStatusEnum.OFFLINE
            && materialEntity.GetMaterialStatus() != ResourceStatusEnum.CLOSED) {
            materialEntity.SetMaterialStatus(ResourceStatusEnum.OFFLINE);
            materialEntity.SetReviewRemark("因举报处置下架");
            materialEntity.SetLastReviewTime(LocalDateTime.now());
            materialEntity.SetUpdateTime(LocalDateTime.now());
            studyMaterialMapper.UpdateMaterial(materialEntity);
        }
    }

    /**
     * 尝试下架商品
     */
    private boolean TryOfflineProduct(Long productId) {
        ProductEntity productEntity = productMapper.FindProductById(productId);
        if (productEntity == null) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now();
        orderMapper.CloseOngoingOrdersByProductId(productId, "因举报处置关闭", now, now);
        productMapper.ForceOfflineProduct(productId, now);
        return true;
    }

    /**
     * 冻结用户
     */
    private void FreezeUser(Long targetUserId) {
        UserEntity userEntity = userMapper.FindUserById(targetUserId);
        if (userEntity == null) {
            throw new BusinessException(BizCodeEnum.USER_NOT_FOUND, "用户不存在");
        }
        if (userEntity.GetUserRole() == UserRoleEnum.ADMINISTRATOR) {
            throw new BusinessException(BizCodeEnum.REPORT_DISPOSITION_ACTION_INVALID, "管理员账号不支持举报冻结");
        }
        if (userEntity.GetUserStatus() == UserStatusEnum.FROZEN) {
            return;
        }
        userEntity.SetUserStatus(UserStatusEnum.FROZEN);
        userEntity.SetUpdateTime(LocalDateTime.now());
        userMapper.UpdateUser(userEntity);
    }

    /**
     * 构建举报响应
     */
    private ReportResponseDto BuildReportResponse(ReportEntity reportEntity) {
        ReportResponseDto responseDto = new ReportResponseDto();
        responseDto.SetReportId(reportEntity.GetReportId());
        responseDto.SetReporterUserId(reportEntity.GetReporterUserId());
        responseDto.SetTargetType(reportEntity.GetTargetType());
        responseDto.SetTargetId(reportEntity.GetTargetId());
        responseDto.SetReasonCategory(reportEntity.GetReasonCategory());
        responseDto.SetDetail(reportEntity.GetDetail());
        responseDto.SetEvidenceFileIds(SplitEvidenceFileIds(reportEntity.GetEvidenceFileIds()));
        responseDto.SetReportStatus(reportEntity.GetReportStatus());
        responseDto.SetReviewResultStatus(reportEntity.GetReviewResultStatus());
        responseDto.SetDispositionAction(reportEntity.GetDispositionAction());
        responseDto.SetReviewerAdminId(reportEntity.GetReviewerAdminId());
        responseDto.SetReviewRemark(reportEntity.GetReviewRemark());
        responseDto.SetReviewTime(reportEntity.GetReviewTime());
        responseDto.SetCloseTime(reportEntity.GetCloseTime());
        responseDto.SetCreateTime(reportEntity.GetCreateTime());
        return responseDto;
    }
}
