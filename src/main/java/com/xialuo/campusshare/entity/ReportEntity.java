package com.xialuo.campusshare.entity;

import com.xialuo.campusshare.enums.ReportStatusEnum;
import java.time.LocalDateTime;

public class ReportEntity extends BaseEntity {
    private Long reportId;
    private Long reporterUserId;
    private Long targetResourceId;
    private Long targetUserId;
    private String reportReason;
    private String evidencePath;
    private ReportStatusEnum reportStatus;
    private Long reviewerAdminId;
    private String reviewRemark;
    private LocalDateTime reviewTime;
}
