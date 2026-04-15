package com.xialuo.campusshare.module.material.dto;

import java.util.List;

/**
 * 我的资料列表响应
 */
public class MaterialListResponseDto {
    /** 页码 */
    private Integer pageNo;
    /** 每页数量 */
    private Integer pageSize;
    /** 总数 */
    private Long totalCount;
    /** 列表 */
    private List<MaterialResponseDto> materialList;

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
     * 获取列表
     */
    public List<MaterialResponseDto> GetMaterialList() {
        return materialList;
    }

    /**
     * 设置列表
     */
    public void SetMaterialList(List<MaterialResponseDto> materialList) {
        this.materialList = materialList;
    }
}
