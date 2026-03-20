package com.xialuo.campusshare.entity;

import java.time.LocalDateTime;

/**
 * 实体公共字段
 */
public class BaseEntity {
    private Long id; // 主键ID
    private LocalDateTime createTime; // 创建时间
    private LocalDateTime updateTime; // 更新时间
    private Boolean deleted; // 逻辑删除标记
}
