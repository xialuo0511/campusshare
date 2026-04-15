package com.xialuo.campusshare.entity;

/**
 * 收藏实体
 */
public class FavoriteEntity extends BaseEntity {
    /** 收藏ID */
    private Long favoriteId;
    /** 用户ID */
    private Long userId;
    /** 资源ID(商品ID) */
    private Long resourceId;
    /** 是否取消 */
    private Boolean canceled;

    /**
     * 获取收藏ID
     */
    public Long GetFavoriteId() {
        return favoriteId;
    }

    /**
     * 设置收藏ID
     */
    public void SetFavoriteId(Long favoriteId) {
        this.favoriteId = favoriteId;
    }

    /**
     * 获取用户ID
     */
    public Long GetUserId() {
        return userId;
    }

    /**
     * 设置用户ID
     */
    public void SetUserId(Long userId) {
        this.userId = userId;
    }

    /**
     * 获取资源ID
     */
    public Long GetResourceId() {
        return resourceId;
    }

    /**
     * 设置资源ID
     */
    public void SetResourceId(Long resourceId) {
        this.resourceId = resourceId;
    }

    /**
     * 获取取消标记
     */
    public Boolean GetCanceled() {
        return canceled;
    }

    /**
     * 设置取消标记
     */
    public void SetCanceled(Boolean canceled) {
        this.canceled = canceled;
    }
}


