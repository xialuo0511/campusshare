package com.xialuo.campusshare.module.team.dto;

import java.util.List;

/**
 * 组队招募列表响应
 */
public class TeamRecruitmentListResponseDto {
    /** 页码 */
    private Integer pageNo;
    /** 页大小 */
    private Integer pageSize;
    /** 总数 */
    private Long totalCount;
    /** 招募中数量 */
    private Long recruitingCount;
    /** 已满员数量 */
    private Long fullCount;
    /** 已关闭数量 */
    private Long closedCount;
    /** 已过期数量 */
    private Long expiredCount;
    /** 待审核数量 */
    private Long pendingReviewCount;
    /** 审核驳回数量 */
    private Long rejectedCount;
    /** 列表 */
    private List<TeamRecruitmentSummaryResponseDto> recruitmentList;

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
     * 获取招募中数量
     */
    public Long GetRecruitingCount() {
        return recruitingCount;
    }

    /**
     * 设置招募中数量
     */
    public void SetRecruitingCount(Long recruitingCount) {
        this.recruitingCount = recruitingCount;
    }

    /**
     * 获取已满员数量
     */
    public Long GetFullCount() {
        return fullCount;
    }

    /**
     * 设置已满员数量
     */
    public void SetFullCount(Long fullCount) {
        this.fullCount = fullCount;
    }

    /**
     * 获取已关闭数量
     */
    public Long GetClosedCount() {
        return closedCount;
    }

    /**
     * 设置已关闭数量
     */
    public void SetClosedCount(Long closedCount) {
        this.closedCount = closedCount;
    }

    /**
     * 获取已过期数量
     */
    public Long GetExpiredCount() {
        return expiredCount;
    }

    /**
     * 设置已过期数量
     */
    public void SetExpiredCount(Long expiredCount) {
        this.expiredCount = expiredCount;
    }

    /**
     * 获取待审核数量
     */
    public Long GetPendingReviewCount() {
        return pendingReviewCount;
    }

    /**
     * 设置待审核数量
     */
    public void SetPendingReviewCount(Long pendingReviewCount) {
        this.pendingReviewCount = pendingReviewCount;
    }

    /**
     * 获取驳回数量
     */
    public Long GetRejectedCount() {
        return rejectedCount;
    }

    /**
     * 设置驳回数量
     */
    public void SetRejectedCount(Long rejectedCount) {
        this.rejectedCount = rejectedCount;
    }

    /**
     * 获取列表
     */
    public List<TeamRecruitmentSummaryResponseDto> GetRecruitmentList() {
        return recruitmentList;
    }

    /**
     * 设置列表
     */
    public void SetRecruitmentList(List<TeamRecruitmentSummaryResponseDto> recruitmentList) {
        this.recruitmentList = recruitmentList;
    }
}
