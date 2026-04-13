package com.xialuo.campusshare.module.point.mapper;

import com.xialuo.campusshare.entity.PointTransactionEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * 积分流水数据映射接口
 */
@Mapper
public interface PointTransactionMapper {
    /**
     * 新增积分流水
     */
    Integer InsertPointTransaction(PointTransactionEntity pointTransactionEntity);
}

