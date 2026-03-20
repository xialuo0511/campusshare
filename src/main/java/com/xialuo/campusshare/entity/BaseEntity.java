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
}


