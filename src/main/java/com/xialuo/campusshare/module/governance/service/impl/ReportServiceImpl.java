package com.xialuo.campusshare.module.governance.service.impl;

import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.entity.ReportEntity;
import com.xialuo.campusshare.enums.NotificationTypeEnum;
import com.xialuo.campusshare.enums.ReportStatusEnum;
import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.module.governance.dto.ReportResponseDto;
import com.xialuo.campusshare.module.governance.dto.ReportReviewRequestDto;
import com.xialuo.campusshare.module.governance.dto.SubmitReportRequestDto;
import com.xialuo.campusshare.module.governance.mapper.ReportMapper;
import com.xialuo.campusshare.module.governance.service.ReportService;
import com.xialuo.campusshare.module.notification.service.NotificationService;
import com.xialuo.campusshare.module.user.mapper.UserMapper;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 举报服务实现
 */
@Service
public class ReportServiceImpl implements ReportService {
    /** 举报业务类型 */
    private static final String REPORT_BIZ_TYPE = "REPORT";

    /** 举报Mapper */
    private final ReportMapper reportMapper;
    /** 通知服务 */
    private final NotificationService notificationService;
    /** 用户Mapper */
    private final UserMapper userMapper;

    public ReportServiceImpl(
        ReportMapper reportMapper,
        NotificationService notificationService,
        UserMapper userMapper
    ) {
        this.reportMapper = reportMapper;
        this.notificationService = notificationService;
        this.userMapper = userMapper;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReportResponseDto SubmitReport(SubmitReportRequestDto requestDto, Long reporterUserId) {
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

        List<Long> adminUserIdList = userMapper.ListActiveAdministratorUserIds();
        notificationService.BatchCreateNotification(
            adminUserIdList,
            NotificationTypeEnum.REVIEW,
            "新举报待处理",
            "收到新的举报单，请及时审核",
            REPORT_BIZ_TYPE,
            reportEntity.GetReportId()
        );
        return BuildReportResponse(reportEntity);
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

        reportEntity.SetReportStatus(ReportStatusEnum.CLOSED);
        reportEntity.SetReviewResultStatus(reviewResultStatus);
        reportEntity.SetDispositionAction(requestDto.GetDispositionAction());
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
        return String.join(",", evidenceFileIds);
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
     * 构建结果消息
     */
    private String BuildReportResultMessage(ReportStatusEnum reviewResultStatus) {
        if (reviewResultStatus == ReportStatusEnum.APPROVED) {
            return "举报已核实并完成处置";
        }
        return "举报已处理，当前结论为驳回";
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
