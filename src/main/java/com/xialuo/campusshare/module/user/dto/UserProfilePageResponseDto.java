package com.xialuo.campusshare.module.user.dto;

import java.util.List;

/**
 * 用户分页响应
 */
public class UserProfilePageResponseDto {
    /** 页码 */
    private Integer pageNo;
    /** 页大小 */
    private Integer pageSize;
    /** 总数 */
    private Long totalCount;
    /** 用户列表 */
    private List<UserProfileResponseDto> userList;

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
     * 获取用户列表
     */
    public List<UserProfileResponseDto> GetUserList() {
        return userList;
    }

    /**
     * 设置用户列表
     */
    public void SetUserList(List<UserProfileResponseDto> userList) {
        this.userList = userList;
    }
}
