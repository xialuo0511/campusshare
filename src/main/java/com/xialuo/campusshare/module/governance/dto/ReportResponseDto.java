package com.xialuo.campusshare.module.governance.dto;

import com.xialuo.campusshare.enums.ReportStatusEnum;
import com.xialuo.campusshare.module.governance.enums.ReportTargetTypeEnum;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 举报响应
 */
public class ReportResponseDto {
    /** 举报ID */
    private Long reportId;
    /** 举报人ID */
    private Long reporterUserId;
    /** 对象类型 */
    private ReportTargetTypeEnum targetType;
    /** 对象ID */
    private Long targetId;
    /** 原因分类 */
    private String reasonCategory;
    /** 补充说明 */
    private String detail;
    /** 证据文件ID列表 */
    private List<String> evidenceFileIds;
    /** 举报状态 */
    private ReportStatusEnum reportStatus;
    /** 处置结论 */
    private ReportStatusEnum reviewResultStatus;
    /** 处置动作 */
    private String dispositionAction;
    /** 审核管理员ID */
    private Long reviewerAdminId;
    /** 审核备注 */
    private String reviewRemark;
    /** 审核时间 */
    private LocalDateTime reviewTime;
    /** 关闭时间 */
    private LocalDateTime closeTime;
    /** 创建时间 */
    private LocalDateTime createTime;

    /**
     * 获取举报ID
     */
    public Long GetReportId() {
        return reportId;
    }

    /**
     * 设置举报ID
     */
    public void SetReportId(Long reportId) {
        this.reportId = reportId;
    }

    /**
     * 获取举报人ID
     */
    public Long GetReporterUserId() {
        return reporterUserId;
    }

    /**
     * 设置举报人ID
     */
    public void SetReporterUserId(Long reporterUserId) {
        this.reporterUserId = reporterUserId;
    }

    /**
     * 获取对象类型
     */
    public ReportTargetTypeEnum GetTargetType() {
        return targetType;
    }

    /**
     * 设置对象类型
     */
    public void SetTargetType(ReportTargetTypeEnum targetType) {
        this.targetType = targetType;
    }

    /**
     * 获取对象ID
     */
    public Long GetTargetId() {
        return targetId;
    }

    /**
     * 设置对象ID
     */
    public void SetTargetId(Long targetId) {
        this.targetId = targetId;
    }

    /**
     * 获取原因分类
     */
    public String GetReasonCategory() {
        return reasonCategory;
    }

    /**
     * 设置原因分类
     */
    public void SetReasonCategory(String reasonCategory) {
        this.reasonCategory = reasonCategory;
    }

    /**
     * 获取补充说明
     */
    public String GetDetail() {
        return detail;
    }

    /**
     * 设置补充说明
     */
    public void SetDetail(String detail) {
        this.detail = detail;
    }

    /**
     * 获取证据文件ID列表
     */
    public List<String> GetEvidenceFileIds() {
        return evidenceFileIds;
    }

    /**
     * 设置证据文件ID列表
     */
    public void SetEvidenceFileIds(List<String> evidenceFileIds) {
        this.evidenceFileIds = evidenceFileIds;
    }

    /**
     * 获取举报状态
     */
    public ReportStatusEnum GetReportStatus() {
        return reportStatus;
    }

    /**
     * 设置举报状态
     */
    public void SetReportStatus(ReportStatusEnum reportStatus) {
        this.reportStatus = reportStatus;
    }

    /**
     * 获取处置结论
     */
    public ReportStatusEnum GetReviewResultStatus() {
        return reviewResultStatus;
    }

    /**
     * 设置处置结论
     */
    public void SetReviewResultStatus(ReportStatusEnum reviewResultStatus) {
        this.reviewResultStatus = reviewResultStatus;
    }

    /**
     * 获取处置动作
     */
    public String GetDispositionAction() {
        return dispositionAction;
    }

    /**
     * 设置处置动作
     */
    public void SetDispositionAction(String dispositionAction) {
        this.dispositionAction = dispositionAction;
    }

    /**
     * 获取审核管理员ID
     */
    public Long GetReviewerAdminId() {
        return reviewerAdminId;
    }

    /**
     * 设置审核管理员ID
     */
    public void SetReviewerAdminId(Long reviewerAdminId) {
        this.reviewerAdminId = reviewerAdminId;
    }

    /**
     * 获取审核备注
     */
    public String GetReviewRemark() {
        return reviewRemark;
    }

    /**
     * 设置审核备注
     */
    public void SetReviewRemark(String reviewRemark) {
        this.reviewRemark = reviewRemark;
    }

    /**
     * 获取审核时间
     */
    public LocalDateTime GetReviewTime() {
        return reviewTime;
    }

    /**
     * 设置审核时间
     */
    public void SetReviewTime(LocalDateTime reviewTime) {
        this.reviewTime = reviewTime;
    }

    /**
     * 获取关闭时间
     */
    public LocalDateTime GetCloseTime() {
        return closeTime;
    }

    /**
     * 设置关闭时间
     */
    public void SetCloseTime(LocalDateTime closeTime) {
        this.closeTime = closeTime;
    }

    /**
     * 获取创建时间
     */
    public LocalDateTime GetCreateTime() {
        return createTime;
    }

    /**
     * 设置创建时间
     */
    public void SetCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }
}
