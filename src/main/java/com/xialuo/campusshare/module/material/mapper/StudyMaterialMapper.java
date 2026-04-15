package com.xialuo.campusshare.module.material.mapper;

import com.xialuo.campusshare.entity.StudyMaterialEntity;
import java.time.LocalDateTime;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 资料数据映射接口
 */
@Mapper
public interface StudyMaterialMapper {
    /**
     * 统计已发布资料总数
     */
    Long CountPublishedMaterials();

    /**
     * 查询最新已发布资料
     */
    List<StudyMaterialEntity> ListRecentPublishedMaterials(@Param("limit") Integer limit);

    /**
     * 新增资料
     */
    Integer InsertMaterial(StudyMaterialEntity materialEntity);

    /**
     * 更新资料
     */
    Integer UpdateMaterial(StudyMaterialEntity materialEntity);

    /**
     * 按ID查询资料
     */
    StudyMaterialEntity FindMaterialById(@Param("materialId") Long materialId);

    /**
     * 查询用户资料
     */
    List<StudyMaterialEntity> ListMaterialsByUploader(@Param("uploaderUserId") Long uploaderUserId);

    /**
     * 分页查询用户资料
     */
    List<StudyMaterialEntity> ListMaterialsByUploaderPaged(
        @Param("uploaderUserId") Long uploaderUserId,
        @Param("materialStatus") String materialStatus,
        @Param("offset") Integer offset,
        @Param("limit") Integer limit
    );

    /**
     * 统计用户资料
     */
    Long CountMaterialsByUploader(
        @Param("uploaderUserId") Long uploaderUserId,
        @Param("materialStatus") String materialStatus
    );

    /**
     * 增加下载次数
     */
    Integer IncreaseDownloadCount(
        @Param("materialId") Long materialId,
        @Param("updateTime") LocalDateTime updateTime
    );
}
