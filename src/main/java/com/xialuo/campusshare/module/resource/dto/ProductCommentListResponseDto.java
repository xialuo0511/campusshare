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
    /** 卖家用户ID */
    private Long sellerUserId;
    /** 卖家昵称 */
    private String sellerDisplayName;
    /** 卖家平均评分 */
    private BigDecimal sellerAverageScore;
    /** 卖家评价总数 */
    private Long sellerScoreCount;
    /** 卖家好评率 */
    private BigDecimal sellerPositiveRate;
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
     * 获取卖家用户ID
     */
    public Long GetSellerUserId() {
        return sellerUserId;
    }

    /**
     * 设置卖家用户ID
     */
    public void SetSellerUserId(Long sellerUserId) {
        this.sellerUserId = sellerUserId;
    }

    /**
     * 获取卖家昵称
     */
    public String GetSellerDisplayName() {
        return sellerDisplayName;
    }

    /**
     * 设置卖家昵称
     */
    public void SetSellerDisplayName(String sellerDisplayName) {
        this.sellerDisplayName = sellerDisplayName;
    }

    /**
     * 获取卖家平均评分
     */
    public BigDecimal GetSellerAverageScore() {
        return sellerAverageScore;
    }

    /**
     * 设置卖家平均评分
     */
    public void SetSellerAverageScore(BigDecimal sellerAverageScore) {
        this.sellerAverageScore = sellerAverageScore;
    }

    /**
     * 获取卖家评价总数
     */
    public Long GetSellerScoreCount() {
        return sellerScoreCount;
    }

    /**
     * 设置卖家评价总数
     */
    public void SetSellerScoreCount(Long sellerScoreCount) {
        this.sellerScoreCount = sellerScoreCount;
    }

    /**
     * 获取卖家好评率
     */
    public BigDecimal GetSellerPositiveRate() {
        return sellerPositiveRate;
    }

    /**
     * 设置卖家好评率
     */
    public void SetSellerPositiveRate(BigDecimal sellerPositiveRate) {
        this.sellerPositiveRate = sellerPositiveRate;
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
