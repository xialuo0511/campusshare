package com.xialuo.campusshare.module.resource.dto;

import java.util.List;

/**
 * 商品列表响应
 */
public class ProductListResponseDto {
    /** 页码 */
    private Integer pageNo;
    /** 每页数量 */
    private Integer pageSize;
    /** 总数 */
    private Long totalCount;
    /** 商品列表 */
    private List<ProductSummaryResponseDto> productList;

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
     * 获取商品列表
     */
    public List<ProductSummaryResponseDto> GetProductList() {
        return productList;
    }

    /**
     * 设置商品列表
     */
    public void SetProductList(List<ProductSummaryResponseDto> productList) {
        this.productList = productList;
    }
}
