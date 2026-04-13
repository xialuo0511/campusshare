package com.xialuo.campusshare.module.order.dto;

import java.util.List;

/**
 * 我的订单列表响应
 */
public class OrderListResponseDto {
    /** 页码 */
    private Integer pageNo;
    /** 每页条数 */
    private Integer pageSize;
    /** 总数 */
    private Long totalCount;
    /** 进行中数量 */
    private Long ongoingCount;
    /** 已完成数量 */
    private Long completedCount;
    /** 已取消数量 */
    private Long canceledCount;
    /** 已关闭数量 */
    private Long closedCount;
    /** 订单列表 */
    private List<OrderResponseDto> orderList;

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
     * 获取进行中数量
     */
    public Long GetOngoingCount() {
        return ongoingCount;
    }

    /**
     * 设置进行中数量
     */
    public void SetOngoingCount(Long ongoingCount) {
        this.ongoingCount = ongoingCount;
    }

    /**
     * 获取已完成数量
     */
    public Long GetCompletedCount() {
        return completedCount;
    }

    /**
     * 设置已完成数量
     */
    public void SetCompletedCount(Long completedCount) {
        this.completedCount = completedCount;
    }

    /**
     * 获取已取消数量
     */
    public Long GetCanceledCount() {
        return canceledCount;
    }

    /**
     * 设置已取消数量
     */
    public void SetCanceledCount(Long canceledCount) {
        this.canceledCount = canceledCount;
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
     * 获取订单列表
     */
    public List<OrderResponseDto> GetOrderList() {
        return orderList;
    }

    /**
     * 设置订单列表
     */
    public void SetOrderList(List<OrderResponseDto> orderList) {
        this.orderList = orderList;
    }
}

