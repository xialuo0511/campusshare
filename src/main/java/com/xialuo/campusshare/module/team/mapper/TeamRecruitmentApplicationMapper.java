package com.xialuo.campusshare.module.team.mapper;

import com.xialuo.campusshare.entity.TeamRecruitmentApplicationEntity;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 组队申请数据映射接口
 */
@Mapper
public interface TeamRecruitmentApplicationMapper {
    /**
     * 新增申请
     */
    Integer InsertApplication(TeamRecruitmentApplicationEntity teamRecruitmentApplicationEntity);

    /**
     * 更新申请
     */
    Integer UpdateApplication(TeamRecruitmentApplicationEntity teamRecruitmentApplicationEntity);

    /**
     * 按ID查询申请
     */
    TeamRecruitmentApplicationEntity FindApplicationById(@Param("applicationId") Long applicationId);

    /**
     * 查询用户在招募下的申请
     */
    TeamRecruitmentApplicationEntity FindApplicationByRecruitmentAndApplicant(
        @Param("recruitmentId") Long recruitmentId,
        @Param("applicantUserId") Long applicantUserId
    );

    /**
     * 查询招募申请列表
     */
    List<TeamRecruitmentApplicationEntity> ListApplicationsByRecruitmentId(@Param("recruitmentId") Long recruitmentId);

    /**
     * 统计招募申请总数
     */
    Long CountApplicationsByRecruitmentId(@Param("recruitmentId") Long recruitmentId);

    /**
     * 查询用户已申请的招募ID列表
     */
    List<Long> ListAppliedRecruitmentIdsByApplicant(
        @Param("applicantUserId") Long applicantUserId,
        @Param("recruitmentIdList") List<Long> recruitmentIdList
    );

    /**
     * 查询全局待审批申请
     */
    List<TeamRecruitmentApplicationEntity> ListPendingApplications();
}
