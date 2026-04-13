package com.xialuo.campusshare.module.point.dto;

import java.util.List;

/**
 * 积分流水分页响应
 */
public class PointLedgerResponseDto {
    /** 页码 */
    private Integer pageNo;
    /** 每页条数 */
    private Integer pageSize;
    /** 总条数 */
    private Long totalCount;
    /** 当前可用积分 */
    private Integer availablePoints;
    /** 累计获得积分 */
    private Integer totalEarnedPoints;
    /** 累计消耗积分 */
    private Integer totalConsumedPoints;
    /** 流水列表 */
    private List<PointTransactionResponseDto> transactionList;

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
     * 获取每页条数
     */
    public Integer GetPageSize() {
        return pageSize;
    }

    /**
     * 设置每页条数
     */
    public void SetPageSize(Integer pageSize) {
        this.pageSize = pageSize;
    }

    /**
     * 获取总条数
     */
    public Long GetTotalCount() {
        return totalCount;
    }

    /**
     * 设置总条数
     */
    public void SetTotalCount(Long totalCount) {
        this.totalCount = totalCount;
    }

    /**
     * 获取当前可用积分
     */
    public Integer GetAvailablePoints() {
        return availablePoints;
    }

    /**
     * 设置当前可用积分
     */
    public void SetAvailablePoints(Integer availablePoints) {
        this.availablePoints = availablePoints;
    }

    /**
     * 获取累计获得积分
     */
    public Integer GetTotalEarnedPoints() {
        return totalEarnedPoints;
    }

    /**
     * 设置累计获得积分
     */
    public void SetTotalEarnedPoints(Integer totalEarnedPoints) {
        this.totalEarnedPoints = totalEarnedPoints;
    }

    /**
     * 获取累计消耗积分
     */
    public Integer GetTotalConsumedPoints() {
        return totalConsumedPoints;
    }

    /**
     * 设置累计消耗积分
     */
    public void SetTotalConsumedPoints(Integer totalConsumedPoints) {
        this.totalConsumedPoints = totalConsumedPoints;
    }

    /**
     * 获取流水列表
     */
    public List<PointTransactionResponseDto> GetTransactionList() {
        return transactionList;
    }

    /**
     * 设置流水列表
     */
    public void SetTransactionList(List<PointTransactionResponseDto> transactionList) {
        this.transactionList = transactionList;
    }
}

