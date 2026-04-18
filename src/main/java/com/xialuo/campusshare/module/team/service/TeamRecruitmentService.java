package com.xialuo.campusshare.module.team.service;

import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.module.team.dto.ApplyTeamRecruitmentRequestDto;
import com.xialuo.campusshare.module.team.dto.PublishTeamRecruitmentRequestDto;
import com.xialuo.campusshare.module.team.dto.TeamRecruitmentApplicationResponseDto;
import com.xialuo.campusshare.module.team.dto.TeamRecruitmentContentReviewRequestDto;
import com.xialuo.campusshare.module.team.dto.TeamRecruitmentListResponseDto;
import com.xialuo.campusshare.module.team.dto.TeamRecruitmentResponseDto;
import com.xialuo.campusshare.module.team.dto.TeamRecruitmentReviewRequestDto;
import java.util.List;

/**
 * 组队招募服务接口
 */
public interface TeamRecruitmentService {
    /**
     * 查询招募列表
     */
    TeamRecruitmentListResponseDto ListRecruitments(
        Integer pageNo,
        Integer pageSize,
        String keyword,
        String direction,
        String status,
        Long currentUserId
    );

    /**
     * 查询招募详情
     */
    TeamRecruitmentResponseDto GetRecruitmentDetail(Long recruitmentId, Long currentUserId);

    /**
     * 发布招募
     */
    TeamRecruitmentResponseDto PublishRecruitment(PublishTeamRecruitmentRequestDto requestDto, Long currentUserId);

    /**
     * 申请加入招募
     */
    TeamRecruitmentApplicationResponseDto ApplyRecruitment(
        Long recruitmentId,
        ApplyTeamRecruitmentRequestDto requestDto,
        Long currentUserId
    );

    /**
     * 查询招募申请列表
     */
    List<TeamRecruitmentApplicationResponseDto> ListRecruitmentApplications(
        Long recruitmentId,
        Long currentUserId,
        UserRoleEnum currentUserRole
    );

    /**
     * 查询全局待审批申请
     */
    List<TeamRecruitmentApplicationResponseDto> ListPendingApplications(
        Long currentUserId,
        UserRoleEnum currentUserRole
    );

    /**
     * 审批通过
     */
    TeamRecruitmentApplicationResponseDto ApproveApplication(
        Long recruitmentId,
        Long applicationId,
        TeamRecruitmentReviewRequestDto requestDto,
        Long currentUserId,
        UserRoleEnum currentUserRole
    );

    /**
     * 审批拒绝
     */
    TeamRecruitmentApplicationResponseDto RejectApplication(
        Long recruitmentId,
        Long applicationId,
        TeamRecruitmentReviewRequestDto requestDto,
        Long currentUserId,
        UserRoleEnum currentUserRole
    );

    /**
     * 查询待审核招募
     */
    TeamRecruitmentListResponseDto ListPendingReviewRecruitments(
        Integer pageNo,
        Integer pageSize,
        Long currentUserId,
        UserRoleEnum currentUserRole
    );

    /**
     * 审核招募
     */
    TeamRecruitmentResponseDto ReviewRecruitment(
        Long recruitmentId,
        TeamRecruitmentContentReviewRequestDto requestDto,
        Long currentUserId,
        UserRoleEnum currentUserRole
    );

    /**
     * 关闭招募
     */
    TeamRecruitmentResponseDto CloseRecruitment(Long recruitmentId, Long currentUserId, UserRoleEnum currentUserRole);
}
