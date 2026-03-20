package com.xialuo.campusshare.common.api;

import com.xialuo.campusshare.common.enums.SortDirectionEnum;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * 分页排序参数
 */
public class PageQuery {
    /** 默认页码 */
    public static final int DEFAULT_PAGE_NO = 1;
    /** 默认每页条数 */
    public static final int DEFAULT_PAGE_SIZE = 10;
    /** 每页最大条数 */
    public static final int MAX_PAGE_SIZE = 100;

    /** 页码 */
    @Min(value = 1, message = "pageNo 最小为 1")
    private Integer pageNo = DEFAULT_PAGE_NO;

    /** 每页条数 */
    @Min(value = 1, message = "pageSize 最小为 1")
    @Max(value = MAX_PAGE_SIZE, message = "pageSize 最大为 100")
    private Integer pageSize = DEFAULT_PAGE_SIZE;

    /** 排序字段 */
    private String sortBy;

    /** 排序方向 */
    private SortDirectionEnum sortDirection = SortDirectionEnum.ASC;

    /**
     * 获取页码
     */
    public Integer GetPageNo() {
        return pageNo;
    }

    /**
     * 获取每页条数
     */
    public Integer GetPageSize() {
        return pageSize;
    }

    /**
     * 获取排序字段
     */
    public String GetSortBy() {
        return sortBy;
    }

    /**
     * 获取排序方向
     */
    public SortDirectionEnum GetSortDirection() {
        return sortDirection;
    }
}
