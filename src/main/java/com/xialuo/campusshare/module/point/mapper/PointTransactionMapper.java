package com.xialuo.campusshare.module.point.mapper;

import com.xialuo.campusshare.entity.PointTransactionEntity;
import java.time.LocalDateTime;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 积分流水数据映射接口
 */
@Mapper
public interface PointTransactionMapper {
    /**
     * 新增积分流水
     */
    Integer InsertPointTransaction(PointTransactionEntity pointTransactionEntity);

    /**
     * 分页查询用户积分流水
     */
    List<PointTransactionEntity> ListByUserId(
        @Param("userId") Long userId,
        @Param("offset") Integer offset,
        @Param("pageSize") Integer pageSize
    );

    /**
     * 统计用户积分流水总数
     */
    Long CountByUserId(@Param("userId") Long userId);

    /**
     * 统计指定时间后的积分流水
     */
    Long CountTransactionsCreatedAfter(@Param("startTime") LocalDateTime startTime);
}
