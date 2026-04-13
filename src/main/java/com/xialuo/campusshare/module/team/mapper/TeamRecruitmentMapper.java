package com.xialuo.campusshare.module.team.mapper;

import com.xialuo.campusshare.entity.TeamRecruitmentEntity;
import com.xialuo.campusshare.enums.TeamRecruitmentStatusEnum;
import java.time.LocalDateTime;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 组队招募数据映射接口
 */
@Mapper
public interface TeamRecruitmentMapper {
    /**
     * 新增招募
     */
    Integer InsertRecruitment(TeamRecruitmentEntity teamRecruitmentEntity);

    /**
     * 更新招募
     */
    Integer UpdateRecruitment(TeamRecruitmentEntity teamRecruitmentEntity);

    /**
     * 按ID查询招募
     */
    TeamRecruitmentEntity FindRecruitmentById(@Param("recruitmentId") Long recruitmentId);

    /**
     * 分页查询招募
     */
    List<TeamRecruitmentEntity> ListRecruitments(
        @Param("keyword") String keyword,
        @Param("direction") String direction,
        @Param("recruitmentStatus") TeamRecruitmentStatusEnum recruitmentStatus,
        @Param("offset") Integer offset,
        @Param("limit") Integer limit
    );

    /**
     * 统计招募总数
     */
    Long CountRecruitments(
        @Param("keyword") String keyword,
        @Param("direction") String direction,
        @Param("recruitmentStatus") TeamRecruitmentStatusEnum recruitmentStatus
    );

    /**
     * 按状态统计
     */
    Long CountRecruitmentsByStatus(@Param("recruitmentStatus") TeamRecruitmentStatusEnum recruitmentStatus);

    /**
     * 将已到期招募标记为过期
     */
    Integer MarkExpiredRecruitments(
        @Param("deadlineTime") LocalDateTime deadlineTime,
        @Param("updateTime") LocalDateTime updateTime
    );

    /**
     * 审批通过后增加成员数
     */
    Integer IncreaseCurrentMemberCount(
        @Param("recruitmentId") Long recruitmentId,
        @Param("updateTime") LocalDateTime updateTime
    );
}

