package com.xialuo.campusshare.module.team.service.impl;

import com.xialuo.campusshare.common.api.PageQuery;
import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.entity.TeamRecruitmentApplicationEntity;
import com.xialuo.campusshare.entity.TeamRecruitmentEntity;
import com.xialuo.campusshare.entity.UserEntity;
import com.xialuo.campusshare.enums.NotificationTypeEnum;
import com.xialuo.campusshare.enums.TeamRecruitmentApplicationStatusEnum;
import com.xialuo.campusshare.enums.TeamRecruitmentStatusEnum;
import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.module.admin.constant.SystemRuleKeyConstants;
import com.xialuo.campusshare.module.admin.service.SystemRuleConfigService;
import com.xialuo.campusshare.module.notification.service.NotificationService;
import com.xialuo.campusshare.module.team.dto.ApplyTeamRecruitmentRequestDto;
import com.xialuo.campusshare.module.team.dto.PublishTeamRecruitmentRequestDto;
import com.xialuo.campusshare.module.team.dto.TeamRecruitmentApplicationResponseDto;
import com.xialuo.campusshare.module.team.dto.TeamRecruitmentContentReviewRequestDto;
import com.xialuo.campusshare.module.team.dto.TeamRecruitmentListResponseDto;
import com.xialuo.campusshare.module.team.dto.TeamRecruitmentResponseDto;
import com.xialuo.campusshare.module.team.dto.TeamRecruitmentReviewRequestDto;
import com.xialuo.campusshare.module.team.dto.TeamRecruitmentSummaryResponseDto;
import com.xialuo.campusshare.module.team.mapper.TeamRecruitmentApplicationMapper;
import com.xialuo.campusshare.module.team.mapper.TeamRecruitmentMapper;
import com.xialuo.campusshare.module.team.service.TeamRecruitmentService;
import com.xialuo.campusshare.module.user.mapper.UserMapper;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 组队招募服务实现
 */
@Service
public class TeamRecruitmentServiceImpl implements TeamRecruitmentService {
    /** 组队业务类型 */
    private static final String TEAM_BIZ_TYPE = "TEAM_RECRUITMENT";
    /** 默认组队审核开关 */
    private static final Boolean DEFAULT_TEAM_RECRUITMENT_REVIEW_REQUIRED = Boolean.TRUE;

    /** 招募Mapper */
    private final TeamRecruitmentMapper teamRecruitmentMapper;
    /** 申请Mapper */
    private final TeamRecruitmentApplicationMapper teamRecruitmentApplicationMapper;
    /** 用户Mapper */
    private final UserMapper userMapper;
    /** 通知服务 */
    private final NotificationService notificationService;
    /** 规则配置服务 */
    private final SystemRuleConfigService systemRuleConfigService;

    public TeamRecruitmentServiceImpl(
        TeamRecruitmentMapper teamRecruitmentMapper,
        TeamRecruitmentApplicationMapper teamRecruitmentApplicationMapper,
        UserMapper userMapper,
        NotificationService notificationService,
        SystemRuleConfigService systemRuleConfigService
    ) {
        this.teamRecruitmentMapper = teamRecruitmentMapper;
        this.teamRecruitmentApplicationMapper = teamRecruitmentApplicationMapper;
        this.userMapper = userMapper;
        this.notificationService = notificationService;
        this.systemRuleConfigService = systemRuleConfigService;
    }

    @Override
    public TeamRecruitmentListResponseDto ListRecruitments(
        Integer pageNo,
        Integer pageSize,
        String keyword,
        String direction,
        String status,
        Long currentUserId
    ) {
        RefreshExpiredRecruitments();

        Integer resolvedPageNo = ResolvePageNo(pageNo);
        Integer resolvedPageSize = ResolvePageSize(pageSize);
        String resolvedKeyword = NormalizeText(keyword);
        String resolvedDirection = NormalizeText(direction);
        TeamRecruitmentStatusEnum resolvedStatus = ResolveStatus(status);
        boolean isAdministrator = IsAdministrator(currentUserId);
        ValidateListStatusPermission(resolvedStatus, isAdministrator);
        Integer offset = (resolvedPageNo - 1) * resolvedPageSize;

        List<TeamRecruitmentEntity> recruitmentEntityList = teamRecruitmentMapper.ListRecruitments(
            resolvedKeyword,
            resolvedDirection,
            resolvedStatus,
            offset,
            resolvedPageSize
        );
        Long totalCount = teamRecruitmentMapper.CountRecruitments(
            resolvedKeyword,
            resolvedDirection,
            resolvedStatus
        );

        Set<Long> appliedRecruitmentIdSet = ResolveAppliedRecruitmentIdSet(currentUserId, recruitmentEntityList);
        List<TeamRecruitmentSummaryResponseDto> summaryResponseList = recruitmentEntityList.stream()
            .map(recruitmentEntity -> BuildRecruitmentSummaryResponse(
                recruitmentEntity,
                currentUserId,
                appliedRecruitmentIdSet.contains(recruitmentEntity.GetRecruitmentId())
            ))
            .toList();

        TeamRecruitmentListResponseDto responseDto = new TeamRecruitmentListResponseDto();
        responseDto.SetPageNo(resolvedPageNo);
        responseDto.SetPageSize(resolvedPageSize);
        responseDto.SetTotalCount(totalCount == null ? 0L : totalCount);
        responseDto.SetRecruitingCount(ResolveStatusCount(TeamRecruitmentStatusEnum.RECRUITING));
        responseDto.SetFullCount(ResolveStatusCount(TeamRecruitmentStatusEnum.FULL));
        responseDto.SetClosedCount(ResolveStatusCount(TeamRecruitmentStatusEnum.CLOSED));
        responseDto.SetExpiredCount(ResolveStatusCount(TeamRecruitmentStatusEnum.EXPIRED));
        responseDto.SetPendingReviewCount(ResolveStatusCount(TeamRecruitmentStatusEnum.PENDING_REVIEW));
        responseDto.SetRejectedCount(ResolveStatusCount(TeamRecruitmentStatusEnum.REJECTED));
        responseDto.SetRecruitmentList(summaryResponseList);
        return responseDto;
    }

    @Override
    public TeamRecruitmentResponseDto GetRecruitmentDetail(Long recruitmentId, Long currentUserId) {
        RefreshExpiredRecruitments();
        TeamRecruitmentEntity recruitmentEntity = GetRecruitmentById(recruitmentId);
        ValidateRecruitmentReadable(recruitmentEntity, currentUserId, IsAdministrator(currentUserId));
        boolean hasApplied = HasAppliedRecruitment(currentUserId, recruitmentId);
        TeamRecruitmentResponseDto responseDto = BuildRecruitmentResponse(recruitmentEntity, currentUserId, hasApplied);
        responseDto.SetApplicationCount(teamRecruitmentApplicationMapper.CountApplicationsByRecruitmentId(recruitmentId));
        return responseDto;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TeamRecruitmentResponseDto PublishRecruitment(PublishTeamRecruitmentRequestDto requestDto, Long currentUserId) {
        TeamRecruitmentStatusEnum initialStatus = BuildInitialRecruitmentStatus(requestDto.GetMemberLimit());
        TeamRecruitmentEntity recruitmentEntity = new TeamRecruitmentEntity();
        recruitmentEntity.SetPublisherUserId(currentUserId);
        recruitmentEntity.SetEventName(NormalizeText(requestDto.GetEventName()));
        recruitmentEntity.SetDirection(NormalizeText(requestDto.GetDirection()));
        recruitmentEntity.SetSkillRequirement(NormalizeText(requestDto.GetSkillRequirement()));
        recruitmentEntity.SetMemberLimit(requestDto.GetMemberLimit());
        recruitmentEntity.SetCurrentMemberCount(1);
        recruitmentEntity.SetRecruitmentStatus(initialStatus);
        recruitmentEntity.SetDeadline(requestDto.GetDeadline());
        recruitmentEntity.SetCreateTime(LocalDateTime.now());
        recruitmentEntity.SetUpdateTime(LocalDateTime.now());
        recruitmentEntity.SetDeleted(Boolean.FALSE);
        teamRecruitmentMapper.InsertRecruitment(recruitmentEntity);

        notificationService.CreateNotification(
            currentUserId,
            initialStatus == TeamRecruitmentStatusEnum.PENDING_REVIEW
                ? NotificationTypeEnum.REVIEW
                : NotificationTypeEnum.TEAM,
            initialStatus == TeamRecruitmentStatusEnum.PENDING_REVIEW
                ? "招募提交成功"
                : "招募发布成功",
            initialStatus == TeamRecruitmentStatusEnum.PENDING_REVIEW
                ? "你的组队招募已提交，等待管理员审核"
                : "你的组队招募已发布，可在招募板查看",
            TEAM_BIZ_TYPE,
            recruitmentEntity.GetRecruitmentId()
        );

        TeamRecruitmentResponseDto responseDto = BuildRecruitmentResponse(recruitmentEntity, currentUserId, false);
        responseDto.SetApplicationCount(0L);
        return responseDto;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TeamRecruitmentApplicationResponseDto ApplyRecruitment(
        Long recruitmentId,
        ApplyTeamRecruitmentRequestDto requestDto,
        Long currentUserId
    ) {
        RefreshExpiredRecruitments();
        TeamRecruitmentEntity recruitmentEntity = GetRecruitmentById(recruitmentId);
        ValidateApplyEligibility(recruitmentEntity, currentUserId);

        TeamRecruitmentApplicationEntity existedApplication = teamRecruitmentApplicationMapper
            .FindApplicationByRecruitmentAndApplicant(recruitmentId, currentUserId);
        if (existedApplication != null) {
            throw new BusinessException(BizCodeEnum.TEAM_RECRUITMENT_APPLICATION_DUPLICATED, "请勿重复申请同一招募");
        }

        TeamRecruitmentApplicationEntity applicationEntity = new TeamRecruitmentApplicationEntity();
        applicationEntity.SetRecruitmentId(recruitmentId);
        applicationEntity.SetApplicantUserId(currentUserId);
        applicationEntity.SetApplicationStatus(TeamRecruitmentApplicationStatusEnum.PENDING);
        applicationEntity.SetApplyRemark(requestDto == null ? "" : NormalizeText(requestDto.GetApplyRemark()));
        applicationEntity.SetCreateTime(LocalDateTime.now());
        applicationEntity.SetUpdateTime(LocalDateTime.now());
        applicationEntity.SetDeleted(Boolean.FALSE);
        teamRecruitmentApplicationMapper.InsertApplication(applicationEntity);

        notificationService.CreateNotification(
            recruitmentEntity.GetPublisherUserId(),
            NotificationTypeEnum.TEAM,
            "收到新的组队申请",
            "你的招募「" + recruitmentEntity.GetEventName() + "」收到新的申请",
            TEAM_BIZ_TYPE,
            recruitmentId
        );

        return BuildApplicationResponse(applicationEntity);
    }

    @Override
    public List<TeamRecruitmentApplicationResponseDto> ListRecruitmentApplications(
        Long recruitmentId,
        Long currentUserId,
        UserRoleEnum currentUserRole
    ) {
        RefreshExpiredRecruitments();
        TeamRecruitmentEntity recruitmentEntity = GetRecruitmentById(recruitmentId);
        ValidateManagePermission(recruitmentEntity, currentUserId, currentUserRole);

        return teamRecruitmentApplicationMapper.ListApplicationsByRecruitmentId(recruitmentId)
            .stream()
            .map(this::BuildApplicationResponse)
            .toList();
    }

    @Override
    public List<TeamRecruitmentApplicationResponseDto> ListPendingApplications(
        Long currentUserId,
        UserRoleEnum currentUserRole
    ) {
        if (currentUserId == null || currentUserId <= 0L) {
            throw new BusinessException(BizCodeEnum.UNAUTHORIZED, "未登录或登录已失效");
        }
        if (currentUserRole != UserRoleEnum.ADMINISTRATOR) {
            throw new BusinessException(BizCodeEnum.FORBIDDEN, "仅管理员可查看全局待审批申请");
        }
        return teamRecruitmentApplicationMapper.ListPendingApplications()
            .stream()
            .map(this::BuildApplicationResponse)
            .toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TeamRecruitmentApplicationResponseDto ApproveApplication(
        Long recruitmentId,
        Long applicationId,
        TeamRecruitmentReviewRequestDto requestDto,
        Long currentUserId,
        UserRoleEnum currentUserRole
    ) {
        RefreshExpiredRecruitments();
        TeamRecruitmentEntity recruitmentEntity = GetRecruitmentById(recruitmentId);
        ValidateManagePermission(recruitmentEntity, currentUserId, currentUserRole);

        TeamRecruitmentApplicationEntity applicationEntity = GetApplicationById(applicationId);
        ValidateApplicationBelonging(applicationEntity, recruitmentId);
        ValidateApplicationPending(applicationEntity);

        Integer increaseRows = teamRecruitmentMapper.IncreaseCurrentMemberCount(recruitmentId, LocalDateTime.now());
        if (increaseRows == null || increaseRows <= 0) {
            throw new BusinessException(BizCodeEnum.TEAM_RECRUITMENT_STATUS_INVALID, "当前招募不可继续审批通过");
        }

        applicationEntity.SetApplicationStatus(TeamRecruitmentApplicationStatusEnum.APPROVED);
        applicationEntity.SetReviewRemark(requestDto == null ? "" : NormalizeText(requestDto.GetReviewRemark()));
        applicationEntity.SetReviewerUserId(currentUserId);
        applicationEntity.SetReviewTime(LocalDateTime.now());
        applicationEntity.SetUpdateTime(LocalDateTime.now());
        teamRecruitmentApplicationMapper.UpdateApplication(applicationEntity);

        notificationService.CreateNotification(
            applicationEntity.GetApplicantUserId(),
            NotificationTypeEnum.TEAM,
            "组队申请已通过",
            "你申请的「" + recruitmentEntity.GetEventName() + "」已通过审批",
            TEAM_BIZ_TYPE,
            recruitmentId
        );

        return BuildApplicationResponse(applicationEntity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TeamRecruitmentApplicationResponseDto RejectApplication(
        Long recruitmentId,
        Long applicationId,
        TeamRecruitmentReviewRequestDto requestDto,
        Long currentUserId,
        UserRoleEnum currentUserRole
    ) {
        RefreshExpiredRecruitments();
        TeamRecruitmentEntity recruitmentEntity = GetRecruitmentById(recruitmentId);
        ValidateManagePermission(recruitmentEntity, currentUserId, currentUserRole);

        TeamRecruitmentApplicationEntity applicationEntity = GetApplicationById(applicationId);
        ValidateApplicationBelonging(applicationEntity, recruitmentId);
        ValidateApplicationPending(applicationEntity);

        applicationEntity.SetApplicationStatus(TeamRecruitmentApplicationStatusEnum.REJECTED);
        applicationEntity.SetReviewRemark(requestDto == null ? "" : NormalizeText(requestDto.GetReviewRemark()));
        applicationEntity.SetReviewerUserId(currentUserId);
        applicationEntity.SetReviewTime(LocalDateTime.now());
        applicationEntity.SetUpdateTime(LocalDateTime.now());
        teamRecruitmentApplicationMapper.UpdateApplication(applicationEntity);

        notificationService.CreateNotification(
            applicationEntity.GetApplicantUserId(),
            NotificationTypeEnum.TEAM,
            "组队申请未通过",
            "你申请的「" + recruitmentEntity.GetEventName() + "」未通过审批",
            TEAM_BIZ_TYPE,
            recruitmentId
        );

        return BuildApplicationResponse(applicationEntity);
    }

    @Override
    public TeamRecruitmentListResponseDto ListPendingReviewRecruitments(
        Integer pageNo,
        Integer pageSize,
        Long currentUserId,
        UserRoleEnum currentUserRole
    ) {
        ValidateAdminPermission(currentUserId, currentUserRole);
        Integer resolvedPageNo = ResolvePageNo(pageNo);
        Integer resolvedPageSize = ResolvePageSize(pageSize);
        Integer offset = (resolvedPageNo - 1) * resolvedPageSize;

        List<TeamRecruitmentEntity> recruitmentEntityList = teamRecruitmentMapper.ListRecruitments(
            null,
            null,
            TeamRecruitmentStatusEnum.PENDING_REVIEW,
            offset,
            resolvedPageSize
        );
        Long totalCount = teamRecruitmentMapper.CountRecruitments(
            null,
            null,
            TeamRecruitmentStatusEnum.PENDING_REVIEW
        );
        List<TeamRecruitmentSummaryResponseDto> summaryResponseList = recruitmentEntityList.stream()
            .map(recruitmentEntity -> BuildRecruitmentSummaryResponse(recruitmentEntity, currentUserId, false))
            .toList();

        TeamRecruitmentListResponseDto responseDto = new TeamRecruitmentListResponseDto();
        responseDto.SetPageNo(resolvedPageNo);
        responseDto.SetPageSize(resolvedPageSize);
        responseDto.SetTotalCount(totalCount == null ? 0L : totalCount);
        responseDto.SetRecruitingCount(ResolveStatusCount(TeamRecruitmentStatusEnum.RECRUITING));
        responseDto.SetFullCount(ResolveStatusCount(TeamRecruitmentStatusEnum.FULL));
        responseDto.SetClosedCount(ResolveStatusCount(TeamRecruitmentStatusEnum.CLOSED));
        responseDto.SetExpiredCount(ResolveStatusCount(TeamRecruitmentStatusEnum.EXPIRED));
        responseDto.SetPendingReviewCount(ResolveStatusCount(TeamRecruitmentStatusEnum.PENDING_REVIEW));
        responseDto.SetRejectedCount(ResolveStatusCount(TeamRecruitmentStatusEnum.REJECTED));
        responseDto.SetRecruitmentList(summaryResponseList);
        return responseDto;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TeamRecruitmentResponseDto ReviewRecruitment(
        Long recruitmentId,
        TeamRecruitmentContentReviewRequestDto requestDto,
        Long currentUserId,
        UserRoleEnum currentUserRole
    ) {
        ValidateAdminPermission(currentUserId, currentUserRole);
        TeamRecruitmentEntity recruitmentEntity = GetRecruitmentById(recruitmentId);
        if (recruitmentEntity.GetRecruitmentStatus() != TeamRecruitmentStatusEnum.PENDING_REVIEW) {
            throw new BusinessException(BizCodeEnum.TEAM_RECRUITMENT_STATUS_INVALID, "当前招募状态不允许审核");
        }
        boolean approved = requestDto != null && Boolean.TRUE.equals(requestDto.GetApproved());
        String reviewRemark = NormalizeText(requestDto == null ? "" : requestDto.GetReviewRemark());

        if (approved) {
            recruitmentEntity.SetRecruitmentStatus(ResolveApprovedRecruitmentStatus(recruitmentEntity.GetMemberLimit()));
            recruitmentEntity.SetCloseTime(null);
        } else {
            recruitmentEntity.SetRecruitmentStatus(TeamRecruitmentStatusEnum.REJECTED);
            recruitmentEntity.SetCloseTime(LocalDateTime.now());
        }
        recruitmentEntity.SetUpdateTime(LocalDateTime.now());
        teamRecruitmentMapper.UpdateRecruitment(recruitmentEntity);

        notificationService.CreateNotification(
            recruitmentEntity.GetPublisherUserId(),
            NotificationTypeEnum.REVIEW,
            approved ? "招募审核通过" : "招募审核未通过",
            BuildRecruitmentReviewContent(approved, reviewRemark),
            TEAM_BIZ_TYPE,
            recruitmentId
        );

        TeamRecruitmentResponseDto responseDto = BuildRecruitmentResponse(recruitmentEntity, currentUserId, false);
        responseDto.SetApplicationCount(teamRecruitmentApplicationMapper.CountApplicationsByRecruitmentId(recruitmentId));
        return responseDto;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public TeamRecruitmentResponseDto CloseRecruitment(Long recruitmentId, Long currentUserId, UserRoleEnum currentUserRole) {
        RefreshExpiredRecruitments();
        TeamRecruitmentEntity recruitmentEntity = GetRecruitmentById(recruitmentId);
        ValidateManagePermission(recruitmentEntity, currentUserId, currentUserRole);
        if (recruitmentEntity.GetRecruitmentStatus() == TeamRecruitmentStatusEnum.CLOSED
            || recruitmentEntity.GetRecruitmentStatus() == TeamRecruitmentStatusEnum.EXPIRED) {
            throw new BusinessException(BizCodeEnum.TEAM_RECRUITMENT_STATUS_INVALID, "当前招募无需再次关闭");
        }

        recruitmentEntity.SetRecruitmentStatus(TeamRecruitmentStatusEnum.CLOSED);
        recruitmentEntity.SetCloseTime(LocalDateTime.now());
        recruitmentEntity.SetUpdateTime(LocalDateTime.now());
        teamRecruitmentMapper.UpdateRecruitment(recruitmentEntity);

        TeamRecruitmentResponseDto responseDto = BuildRecruitmentResponse(recruitmentEntity, currentUserId, false);
        responseDto.SetApplicationCount(teamRecruitmentApplicationMapper.CountApplicationsByRecruitmentId(recruitmentId));
        return responseDto;
    }

    /**
     * 获取招募
     */
    private TeamRecruitmentEntity GetRecruitmentById(Long recruitmentId) {
        TeamRecruitmentEntity recruitmentEntity = teamRecruitmentMapper.FindRecruitmentById(recruitmentId);
        if (recruitmentEntity == null) {
            throw new BusinessException(BizCodeEnum.TEAM_RECRUITMENT_NOT_FOUND, "招募不存在");
        }
        return recruitmentEntity;
    }

    /**
     * 获取申请
     */
    private TeamRecruitmentApplicationEntity GetApplicationById(Long applicationId) {
        TeamRecruitmentApplicationEntity applicationEntity = teamRecruitmentApplicationMapper.FindApplicationById(applicationId);
        if (applicationEntity == null) {
            throw new BusinessException(BizCodeEnum.TEAM_RECRUITMENT_APPLICATION_NOT_FOUND, "招募申请不存在");
        }
        return applicationEntity;
    }

    /**
     * 刷新过期状态
     */
    private void RefreshExpiredRecruitments() {
        teamRecruitmentMapper.MarkExpiredRecruitments(LocalDateTime.now(), LocalDateTime.now());
    }

    /**
     * 校验可申请
     */
    private void ValidateApplyEligibility(TeamRecruitmentEntity recruitmentEntity, Long currentUserId) {
        if (currentUserId.equals(recruitmentEntity.GetPublisherUserId())) {
            throw new BusinessException(BizCodeEnum.TEAM_RECRUITMENT_PERMISSION_DENIED, "发起人不能申请自己的招募");
        }
        if (recruitmentEntity.GetRecruitmentStatus() != TeamRecruitmentStatusEnum.RECRUITING) {
            throw new BusinessException(BizCodeEnum.TEAM_RECRUITMENT_STATUS_INVALID, "当前招募不可申请");
        }
        if (recruitmentEntity.GetDeadline() != null && !recruitmentEntity.GetDeadline().isAfter(LocalDateTime.now())) {
            throw new BusinessException(BizCodeEnum.TEAM_RECRUITMENT_STATUS_INVALID, "当前招募已截止");
        }
        Integer currentMemberCount = recruitmentEntity.GetCurrentMemberCount() == null
            ? 0
            : recruitmentEntity.GetCurrentMemberCount();
        Integer memberLimit = recruitmentEntity.GetMemberLimit() == null
            ? 0
            : recruitmentEntity.GetMemberLimit();
        if (currentMemberCount >= memberLimit) {
            throw new BusinessException(BizCodeEnum.TEAM_RECRUITMENT_STATUS_INVALID, "当前招募已满员");
        }
    }

    /**
     * 校验管理权限
     */
    private void ValidateManagePermission(
        TeamRecruitmentEntity recruitmentEntity,
        Long currentUserId,
        UserRoleEnum currentUserRole
    ) {
        if (currentUserRole == UserRoleEnum.ADMINISTRATOR) {
            return;
        }
        if (currentUserId.equals(recruitmentEntity.GetPublisherUserId())) {
            return;
        }
        throw new BusinessException(BizCodeEnum.TEAM_RECRUITMENT_PERMISSION_DENIED, "无权管理该招募");
    }

    /**
     * 校验管理员权限
     */
    private void ValidateAdminPermission(Long currentUserId, UserRoleEnum currentUserRole) {
        if (currentUserId == null || currentUserId <= 0L) {
            throw new BusinessException(BizCodeEnum.UNAUTHORIZED, "未登录或登录已失效");
        }
        if (currentUserRole != UserRoleEnum.ADMINISTRATOR) {
            throw new BusinessException(BizCodeEnum.FORBIDDEN, "仅管理员可执行该操作");
        }
    }

    /**
     * 校验列表状态查询权限
     */
    private void ValidateListStatusPermission(
        TeamRecruitmentStatusEnum recruitmentStatus,
        boolean isAdministrator
    ) {
        if (recruitmentStatus == null) {
            return;
        }
        if (recruitmentStatus != TeamRecruitmentStatusEnum.PENDING_REVIEW
            && recruitmentStatus != TeamRecruitmentStatusEnum.REJECTED) {
            return;
        }
        if (isAdministrator) {
            return;
        }
        throw new BusinessException(BizCodeEnum.TEAM_RECRUITMENT_PERMISSION_DENIED, "无权查看该状态招募");
    }

    /**
     * 校验详情可读权限
     */
    private void ValidateRecruitmentReadable(
        TeamRecruitmentEntity recruitmentEntity,
        Long currentUserId,
        boolean isAdministrator
    ) {
        if (recruitmentEntity.GetRecruitmentStatus() != TeamRecruitmentStatusEnum.PENDING_REVIEW
            && recruitmentEntity.GetRecruitmentStatus() != TeamRecruitmentStatusEnum.REJECTED) {
            return;
        }
        if (isAdministrator) {
            return;
        }
        if (currentUserId != null && currentUserId.equals(recruitmentEntity.GetPublisherUserId())) {
            return;
        }
        throw new BusinessException(BizCodeEnum.TEAM_RECRUITMENT_PERMISSION_DENIED, "无权查看该招募");
    }

    /**
     * 校验申请归属
     */
    private void ValidateApplicationBelonging(TeamRecruitmentApplicationEntity applicationEntity, Long recruitmentId) {
        if (!recruitmentId.equals(applicationEntity.GetRecruitmentId())) {
            throw new BusinessException(BizCodeEnum.TEAM_RECRUITMENT_APPLICATION_NOT_FOUND, "申请不存在于当前招募");
        }
    }

    /**
     * 校验申请状态
     */
    private void ValidateApplicationPending(TeamRecruitmentApplicationEntity applicationEntity) {
        if (applicationEntity.GetApplicationStatus() != TeamRecruitmentApplicationStatusEnum.PENDING) {
            throw new BusinessException(BizCodeEnum.TEAM_RECRUITMENT_APPLICATION_STATUS_INVALID, "当前申请不可审批");
        }
    }

    /**
     * 构建招募摘要
     */
    private TeamRecruitmentSummaryResponseDto BuildRecruitmentSummaryResponse(
        TeamRecruitmentEntity recruitmentEntity,
        Long currentUserId,
        boolean hasApplied
    ) {
        TeamRecruitmentSummaryResponseDto responseDto = new TeamRecruitmentSummaryResponseDto();
        responseDto.SetRecruitmentId(recruitmentEntity.GetRecruitmentId());
        responseDto.SetPublisherUserId(recruitmentEntity.GetPublisherUserId());
        responseDto.SetPublisherDisplayName(ResolveUserDisplayName(recruitmentEntity.GetPublisherUserId()));
        responseDto.SetEventName(recruitmentEntity.GetEventName());
        responseDto.SetDirection(recruitmentEntity.GetDirection());
        responseDto.SetSkillRequirement(recruitmentEntity.GetSkillRequirement());
        responseDto.SetMemberLimit(recruitmentEntity.GetMemberLimit());
        responseDto.SetCurrentMemberCount(recruitmentEntity.GetCurrentMemberCount());
        responseDto.SetRecruitmentStatus(recruitmentEntity.GetRecruitmentStatus());
        responseDto.SetDeadline(recruitmentEntity.GetDeadline());
        responseDto.SetCreateTime(recruitmentEntity.GetCreateTime());
        responseDto.SetHasApplied(hasApplied);
        responseDto.SetCanApply(ResolveCanApply(recruitmentEntity, currentUserId, hasApplied));
        return responseDto;
    }

    /**
     * 构建招募详情
     */
    private TeamRecruitmentResponseDto BuildRecruitmentResponse(
        TeamRecruitmentEntity recruitmentEntity,
        Long currentUserId,
        boolean hasApplied
    ) {
        TeamRecruitmentResponseDto responseDto = new TeamRecruitmentResponseDto();
        TeamRecruitmentSummaryResponseDto summaryResponseDto = BuildRecruitmentSummaryResponse(
            recruitmentEntity,
            currentUserId,
            hasApplied
        );
        responseDto.SetRecruitmentId(summaryResponseDto.GetRecruitmentId());
        responseDto.SetPublisherUserId(summaryResponseDto.GetPublisherUserId());
        responseDto.SetPublisherDisplayName(summaryResponseDto.GetPublisherDisplayName());
        responseDto.SetEventName(summaryResponseDto.GetEventName());
        responseDto.SetDirection(summaryResponseDto.GetDirection());
        responseDto.SetSkillRequirement(summaryResponseDto.GetSkillRequirement());
        responseDto.SetMemberLimit(summaryResponseDto.GetMemberLimit());
        responseDto.SetCurrentMemberCount(summaryResponseDto.GetCurrentMemberCount());
        responseDto.SetRecruitmentStatus(summaryResponseDto.GetRecruitmentStatus());
        responseDto.SetDeadline(summaryResponseDto.GetDeadline());
        responseDto.SetCreateTime(summaryResponseDto.GetCreateTime());
        responseDto.SetCanApply(summaryResponseDto.GetCanApply());
        responseDto.SetHasApplied(summaryResponseDto.GetHasApplied());
        responseDto.SetCloseTime(recruitmentEntity.GetCloseTime());
        return responseDto;
    }

    /**
     * 构建申请响应
     */
    private TeamRecruitmentApplicationResponseDto BuildApplicationResponse(TeamRecruitmentApplicationEntity applicationEntity) {
        TeamRecruitmentApplicationResponseDto responseDto = new TeamRecruitmentApplicationResponseDto();
        responseDto.SetApplicationId(applicationEntity.GetApplicationId());
        responseDto.SetRecruitmentId(applicationEntity.GetRecruitmentId());
        responseDto.SetApplicantUserId(applicationEntity.GetApplicantUserId());
        responseDto.SetApplicantDisplayName(ResolveUserDisplayName(applicationEntity.GetApplicantUserId()));
        responseDto.SetApplicationStatus(applicationEntity.GetApplicationStatus());
        responseDto.SetApplyRemark(applicationEntity.GetApplyRemark());
        responseDto.SetReviewRemark(applicationEntity.GetReviewRemark());
        responseDto.SetReviewerUserId(applicationEntity.GetReviewerUserId());
        responseDto.SetReviewTime(applicationEntity.GetReviewTime());
        responseDto.SetCreateTime(applicationEntity.GetCreateTime());
        return responseDto;
    }

    /**
     * 获取已申请集合
     */
    private Set<Long> ResolveAppliedRecruitmentIdSet(Long currentUserId, List<TeamRecruitmentEntity> recruitmentEntityList) {
        if (currentUserId == null || recruitmentEntityList == null || recruitmentEntityList.isEmpty()) {
            return new HashSet<>();
        }
        List<Long> recruitmentIdList = recruitmentEntityList.stream()
            .map(TeamRecruitmentEntity::GetRecruitmentId)
            .toList();
        List<Long> appliedRecruitmentIdList = teamRecruitmentApplicationMapper.ListAppliedRecruitmentIdsByApplicant(
            currentUserId,
            recruitmentIdList
        );
        return new HashSet<>(appliedRecruitmentIdList);
    }

    /**
     * 判断是否已申请
     */
    private boolean HasAppliedRecruitment(Long currentUserId, Long recruitmentId) {
        if (currentUserId == null) {
            return false;
        }
        TeamRecruitmentApplicationEntity applicationEntity = teamRecruitmentApplicationMapper
            .FindApplicationByRecruitmentAndApplicant(recruitmentId, currentUserId);
        return applicationEntity != null;
    }

    /**
     * 获取状态统计
     */
    private Long ResolveStatusCount(TeamRecruitmentStatusEnum recruitmentStatus) {
        Long count = teamRecruitmentMapper.CountRecruitmentsByStatus(recruitmentStatus);
        return count == null ? 0L : count;
    }

    /**
     * 获取用户昵称
     */
    private String ResolveUserDisplayName(Long userId) {
        if (userId == null) {
            return "未知用户";
        }
        UserEntity userEntity = userMapper.FindUserById(userId);
        if (userEntity == null || userEntity.GetDisplayName() == null || userEntity.GetDisplayName().isBlank()) {
            return "用户#" + userId;
        }
        return userEntity.GetDisplayName().trim();
    }

    /**
     * 构建初始状态
     */
    private TeamRecruitmentStatusEnum BuildInitialRecruitmentStatus(Integer memberLimit) {
        if (Boolean.TRUE.equals(ResolveTeamRecruitmentReviewRequired())) {
            return TeamRecruitmentStatusEnum.PENDING_REVIEW;
        }
        return ResolveApprovedRecruitmentStatus(memberLimit);
    }

    /**
     * 读取组队审核开关
     */
    private Boolean ResolveTeamRecruitmentReviewRequired() {
        return systemRuleConfigService.GetRuleBooleanValueOrDefault(
            SystemRuleKeyConstants.TEAM_RECRUITMENT_REVIEW_REQUIRED,
            DEFAULT_TEAM_RECRUITMENT_REVIEW_REQUIRED
        );
    }

    /**
     * 解析审核通过后的初始状态
     */
    private TeamRecruitmentStatusEnum ResolveApprovedRecruitmentStatus(Integer memberLimit) {
        if (memberLimit == null || memberLimit <= 1) {
            return TeamRecruitmentStatusEnum.FULL;
        }
        return TeamRecruitmentStatusEnum.RECRUITING;
    }

    /**
     * 是否管理员
     */
    private boolean IsAdministrator(Long currentUserId) {
        if (currentUserId == null || currentUserId <= 0L) {
            return false;
        }
        UserEntity userEntity = userMapper.FindUserById(currentUserId);
        if (userEntity == null || userEntity.GetUserRole() == null) {
            return false;
        }
        return userEntity.GetUserRole() == UserRoleEnum.ADMINISTRATOR;
    }

    /**
     * 构建招募审核通知内容
     */
    private String BuildRecruitmentReviewContent(boolean approved, String reviewRemark) {
        if (approved) {
            return "招募审核通过，已可在招募板展示";
        }
        if (reviewRemark.isBlank()) {
            return "招募审核未通过，请修改后重新提交";
        }
        return "招募审核未通过：" + reviewRemark;
    }

    /**
     * 计算是否可申请
     */
    private boolean ResolveCanApply(TeamRecruitmentEntity recruitmentEntity, Long currentUserId, boolean hasApplied) {
        if (currentUserId == null) {
            return false;
        }
        if (currentUserId.equals(recruitmentEntity.GetPublisherUserId())) {
            return false;
        }
        if (hasApplied) {
            return false;
        }
        if (recruitmentEntity.GetRecruitmentStatus() != TeamRecruitmentStatusEnum.RECRUITING) {
            return false;
        }
        if (recruitmentEntity.GetDeadline() != null && !recruitmentEntity.GetDeadline().isAfter(LocalDateTime.now())) {
            return false;
        }
        Integer currentMemberCount = recruitmentEntity.GetCurrentMemberCount() == null
            ? 0
            : recruitmentEntity.GetCurrentMemberCount();
        Integer memberLimit = recruitmentEntity.GetMemberLimit() == null
            ? 0
            : recruitmentEntity.GetMemberLimit();
        return currentMemberCount < memberLimit;
    }

    /**
     * 解析页码
     */
    private Integer ResolvePageNo(Integer pageNo) {
        if (pageNo == null || pageNo < 1) {
            return PageQuery.DEFAULT_PAGE_NO;
        }
        return pageNo;
    }

    /**
     * 解析页大小
     */
    private Integer ResolvePageSize(Integer pageSize) {
        if (pageSize == null || pageSize < 1) {
            return PageQuery.DEFAULT_PAGE_SIZE;
        }
        if (pageSize > PageQuery.MAX_PAGE_SIZE) {
            return PageQuery.MAX_PAGE_SIZE;
        }
        return pageSize;
    }

    /**
     * 解析状态参数
     */
    private TeamRecruitmentStatusEnum ResolveStatus(String status) {
        String normalizedStatus = NormalizeText(status);
        if (normalizedStatus.isBlank()) {
            return null;
        }
        try {
            return TeamRecruitmentStatusEnum.valueOf(normalizedStatus.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new BusinessException(BizCodeEnum.PARAM_INVALID, "状态参数非法");
        }
    }

    /**
     * 文本规范化
     */
    private String NormalizeText(String text) {
        return text == null ? "" : text.trim();
    }
}
