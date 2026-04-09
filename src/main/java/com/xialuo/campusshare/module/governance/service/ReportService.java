package com.xialuo.campusshare.module.governance.service;

import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.module.governance.dto.ReportResponseDto;
import com.xialuo.campusshare.module.governance.dto.ReportReviewRequestDto;
import com.xialuo.campusshare.module.governance.dto.SubmitReportRequestDto;
import java.util.List;

/**
 * 举报服务接口
 */
public interface ReportService {
    /**
     * 提交举报
     */
    ReportResponseDto SubmitReport(SubmitReportRequestDto requestDto, Long reporterUserId);

    /**
     * 查询举报详情
     */
    ReportResponseDto GetReportDetail(Long reportId, Long currentUserId, UserRoleEnum currentUserRole);

    /**
     * 查询待处理举报
     */
    List<ReportResponseDto> ListPendingReports();

    /**
     * 审核举报
     */
    ReportResponseDto ReviewReport(Long reportId, ReportReviewRequestDto requestDto, Long adminUserId);
}
