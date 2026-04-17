package com.xialuo.campusshare.module.resource.mapper;

import com.xialuo.campusshare.entity.FavoriteEntity;
import com.xialuo.campusshare.enums.ResourceTypeEnum;
import java.util.List;
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
    FavoriteEntity FindByUserIdAndResourceIdAndType(
        @Param("userId") Long userId,
        @Param("resourceId") Long resourceId,
        @Param("resourceType") ResourceTypeEnum resourceType
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
    Long CountActiveByResourceIdAndType(
        @Param("resourceId") Long resourceId,
        @Param("resourceType") ResourceTypeEnum resourceType
    );

    /**
     * 分页查询用户收藏资源ID
     */
    List<Long> ListActiveResourceIdsByUserAndType(
        @Param("userId") Long userId,
        @Param("resourceType") ResourceTypeEnum resourceType,
        @Param("offset") Integer offset,
        @Param("limit") Integer limit
    );

    /**
     * 统计用户收藏数量
     */
    Long CountActiveByUserAndType(
        @Param("userId") Long userId,
        @Param("resourceType") ResourceTypeEnum resourceType
    );
}
