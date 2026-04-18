package com.xialuo.campusshare.module.admin.dto;

import java.util.List;

/**
 * 审计日志分页响应
 */
public class AuditLogListResponseDto {
    /** 页码 */
    private Integer pageNo;
    /** 页大小 */
    private Integer pageSize;
    /** 总数 */
    private Long totalCount;
    /** 日志列表 */
    private List<AuditLogResponseDto> auditLogList;

    /**
     * 获取页码
     */
    public Integer GetPageNo() {
        return pageNo;
    }

    /**
     * 设置页码
     */
    public void SetPageNo(Integer pageNo) {
        this.pageNo = pageNo;
    }

    /**
     * 获取页大小
     */
    public Integer GetPageSize() {
        return pageSize;
    }

    /**
     * 设置页大小
     */
    public void SetPageSize(Integer pageSize) {
        this.pageSize = pageSize;
    }

    /**
     * 获取总数
     */
    public Long GetTotalCount() {
        return totalCount;
    }

    /**
     * 设置总数
     */
    public void SetTotalCount(Long totalCount) {
        this.totalCount = totalCount;
    }

    /**
     * 获取日志列表
     */
    public List<AuditLogResponseDto> GetAuditLogList() {
        return auditLogList;
    }

    /**
     * 设置日志列表
     */
    public void SetAuditLogList(List<AuditLogResponseDto> auditLogList) {
        this.auditLogList = auditLogList;
    }
}

