package com.xialuo.campusshare.entity;

/**
 * 收藏实体
 */
public class FavoriteEntity extends BaseEntity {
    /** 收藏ID */
    private Long favoriteId;
    /** 用户ID */
    private Long userId;
    /** 资源ID */
    private Long resourceId;
    /** 是否取消 */
    private Boolean canceled;
}


