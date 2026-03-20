package com.xialuo.campusshare.entity;

/**
 * 收藏实体
 */
public class FavoriteEntity extends BaseEntity {
    private Long favoriteId; // 收藏ID
    private Long userId; // 用户ID
    private Long resourceId; // 资源ID
    private Boolean canceled; // 是否取消
}
