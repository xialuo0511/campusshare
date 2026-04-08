package com.xialuo.campusshare.entity;

import java.time.LocalDateTime;

/**
 * 实体公共字段
 */
public class BaseEntity {
    /** 主键ID */
    private Long id;
    /** 创建时间 */
    private LocalDateTime createTime;
    /** 更新时间 */
    private LocalDateTime updateTime;
    /** 逻辑删除标记 */
    private Boolean deleted;

    /**
     * 获取主键ID
     */
    public Long GetId() {
        return id;
    }

    /**
     * 设置主键ID
     */
    public void SetId(Long id) {
        this.id = id;
    }

    /**
     * 获取创建时间
     */
    public LocalDateTime GetCreateTime() {
        return createTime;
    }

    /**
     * 设置创建时间
     */
    public void SetCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }

    /**
     * 获取更新时间
     */
    public LocalDateTime GetUpdateTime() {
        return updateTime;
    }

    /**
     * 设置更新时间
     */
    public void SetUpdateTime(LocalDateTime updateTime) {
        this.updateTime = updateTime;
    }

    /**
     * 获取逻辑删除标记
     */
    public Boolean GetDeleted() {
        return deleted;
    }

    /**
     * 设置逻辑删除标记
     */
    public void SetDeleted(Boolean deleted) {
        this.deleted = deleted;
    }
}


