package com.xialuo.campusshare.module.point.mapper;

import com.xialuo.campusshare.entity.PointAccountEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 积分账户数据映射接口
 */
@Mapper
public interface PointAccountMapper {
    /**
     * 按用户ID查询积分账户并加锁
     */
    PointAccountEntity FindByUserIdForUpdate(@Param("userId") Long userId);

    /**
     * 新增积分账户
     */
    Integer InsertPointAccount(PointAccountEntity pointAccountEntity);

    /**
     * 更新积分账户
     */
    Integer UpdatePointAccount(PointAccountEntity pointAccountEntity);
}

