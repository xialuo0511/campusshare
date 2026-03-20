package com.xialuo.campusshare.entity;

import com.xialuo.campusshare.enums.ReportStatusEnum;
import java.time.LocalDateTime;

/**
 * 举报实体
 */
public class ReportEntity extends BaseEntity {
    /** 举报ID */
    private Long reportId;
    /** 举报人ID */
    private Long reporterUserId;
    /** 被举报资源ID */
    private Long targetResourceId;
    /** 被举报用户ID */
    private Long targetUserId;
    /** 举报原因 */
    private String reportReason;
    /** 证据路径 */
    private String evidencePath;
    /** 举报状态 */
    private ReportStatusEnum reportStatus;
    /** 审核管理员ID */
    private Long reviewerAdminId;
    /** 审核备注 */
    private String reviewRemark;
    /** 审核时间 */
    private LocalDateTime reviewTime;
}


