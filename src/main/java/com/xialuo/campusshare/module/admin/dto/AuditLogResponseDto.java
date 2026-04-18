package com.xialuo.campusshare.module.admin.dto;

import java.time.LocalDateTime;

/**
 * 审计日志响应
 */
public class AuditLogResponseDto {
    /** 审计日志ID */
    private Long auditLogId;
    /** 操作人ID */
    private Long operatorUserId;
    /** 操作类型 */
    private String actionType;
    /** 目标类型 */
    private String targetType;
    /** 目标ID */
    private Long targetId;
    /** 操作结果 */
    private String actionResult;
    /** 操作明细 */
    private String actionDetail;
    /** 创建时间 */
    private LocalDateTime createTime;

    /**
     * 获取审计日志ID
     */
    public Long GetAuditLogId() {
        return auditLogId;
    }

    /**
     * 设置审计日志ID
     */
    public void SetAuditLogId(Long auditLogId) {
        this.auditLogId = auditLogId;
    }

    /**
     * 获取操作人ID
     */
    public Long GetOperatorUserId() {
        return operatorUserId;
    }

    /**
     * 设置操作人ID
     */
    public void SetOperatorUserId(Long operatorUserId) {
        this.operatorUserId = operatorUserId;
    }

    /**
     * 获取操作类型
     */
    public String GetActionType() {
        return actionType;
    }

    /**
     * 设置操作类型
     */
    public void SetActionType(String actionType) {
        this.actionType = actionType;
    }

    /**
     * 获取目标类型
     */
    public String GetTargetType() {
        return targetType;
    }

    /**
     * 设置目标类型
     */
    public void SetTargetType(String targetType) {
        this.targetType = targetType;
    }

    /**
     * 获取目标ID
     */
    public Long GetTargetId() {
        return targetId;
    }

    /**
     * 设置目标ID
     */
    public void SetTargetId(Long targetId) {
        this.targetId = targetId;
    }

    /**
     * 获取操作结果
     */
    public String GetActionResult() {
        return actionResult;
    }

    /**
     * 设置操作结果
     */
    public void SetActionResult(String actionResult) {
        this.actionResult = actionResult;
    }

    /**
     * 获取操作明细
     */
    public String GetActionDetail() {
        return actionDetail;
    }

    /**
     * 设置操作明细
     */
    public void SetActionDetail(String actionDetail) {
        this.actionDetail = actionDetail;
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

