package com.xialuo.campusshare.module.resource.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * 商品评论列表响应
 */
public class ProductCommentListResponseDto {
    /** 页码 */
    private Integer pageNo;
    /** 每页数量 */
    private Integer pageSize;
    /** 总数 */
    private Long totalCount;
    /** 平均评分 */
    private BigDecimal averageScore;
    /** 评论列表 */
    private List<ProductCommentResponseDto> commentList;

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
     * 获取每页数量
     */
    public Integer GetPageSize() {
        return pageSize;
    }

    /**
     * 设置每页数量
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
     * 获取平均评分
     */
    public BigDecimal GetAverageScore() {
        return averageScore;
    }

    /**
     * 设置平均评分
     */
    public void SetAverageScore(BigDecimal averageScore) {
        this.averageScore = averageScore;
    }

    /**
     * 获取评论列表
     */
    public List<ProductCommentResponseDto> GetCommentList() {
        return commentList;
    }

    /**
     * 设置评论列表
     */
    public void SetCommentList(List<ProductCommentResponseDto> commentList) {
        this.commentList = commentList;
    }
}

