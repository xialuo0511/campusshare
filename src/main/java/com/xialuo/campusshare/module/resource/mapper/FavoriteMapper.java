package com.xialuo.campusshare.module.resource.mapper;

import com.xialuo.campusshare.entity.FavoriteEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 收藏数据映射
 */
@Mapper
public interface FavoriteMapper {
    /**
     * 按用户和资源查询收藏
     */
    FavoriteEntity FindByUserIdAndResourceId(
        @Param("userId") Long userId,
        @Param("resourceId") Long resourceId
    );

    /**
     * 新增收藏
     */
    Integer InsertFavorite(FavoriteEntity favoriteEntity);

    /**
     * 更新收藏
     */
    Integer UpdateFavorite(FavoriteEntity favoriteEntity);

    /**
     * 统计有效收藏数量
     */
    Long CountActiveByResourceId(@Param("resourceId") Long resourceId);
}
