package com.xialuo.campusshare.module.material.mapper;

import com.xialuo.campusshare.entity.StudyMaterialEntity;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 资料数据映射接口
 */
@Mapper
public interface StudyMaterialMapper {
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
}
