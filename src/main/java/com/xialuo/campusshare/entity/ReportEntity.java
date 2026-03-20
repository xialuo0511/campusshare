package com.xialuo.campusshare.entity;

import com.xialuo.campusshare.enums.ReportStatusEnum;
import java.time.LocalDateTime;

/**
 * 举报实体
 */
public class ReportEntity extends BaseEntity {
    private Long reportId; // 举报ID
    private Long reporterUserId; // 举报人ID
    private Long targetResourceId; // 被举报资源ID
    private Long targetUserId; // 被举报用户ID
    private String reportReason; // 举报原因
    private String evidencePath; // 证据路径
    private ReportStatusEnum reportStatus; // 举报状态
    private Long reviewerAdminId; // 审核管理员ID
    private String reviewRemark; // 审核备注
    private LocalDateTime reviewTime; // 审核时间
}
