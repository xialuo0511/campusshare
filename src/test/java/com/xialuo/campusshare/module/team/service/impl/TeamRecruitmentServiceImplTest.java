package com.xialuo.campusshare.module.team.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.entity.TeamRecruitmentEntity;
import com.xialuo.campusshare.entity.UserEntity;
import com.xialuo.campusshare.enums.TeamRecruitmentStatusEnum;
import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.module.admin.service.SystemRuleConfigService;
import com.xialuo.campusshare.module.notification.service.NotificationService;
import com.xialuo.campusshare.module.team.mapper.TeamRecruitmentApplicationMapper;
import com.xialuo.campusshare.module.team.mapper.TeamRecruitmentMapper;
import com.xialuo.campusshare.module.user.mapper.UserMapper;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;

/**
 * Team recruitment service boundary tests.
 */
class TeamRecruitmentServiceImplTest {

    @Test
    void PublisherShouldNotApplyOwnRecruitment() {
        TeamRecruitmentMapper recruitmentMapper = mock(TeamRecruitmentMapper.class);
        TeamRecruitmentApplicationMapper applicationMapper = mock(TeamRecruitmentApplicationMapper.class);
        TeamRecruitmentServiceImpl service = BuildService(recruitmentMapper, applicationMapper, mock(UserMapper.class));
        when(recruitmentMapper.FindRecruitmentById(10L)).thenReturn(BuildRecruitment(10L, 100L, TeamRecruitmentStatusEnum.RECRUITING));

        assertThrows(BusinessException.class, () -> service.ApplyRecruitment(10L, null, 100L));
        verify(applicationMapper, never()).InsertApplication(any());
    }

    @Test
    void NonAdminShouldNotListPendingReviewRecruitments() {
        TeamRecruitmentServiceImpl service = BuildService(
            mock(TeamRecruitmentMapper.class),
            mock(TeamRecruitmentApplicationMapper.class),
            mock(UserMapper.class)
        );

        assertThrows(
            BusinessException.class,
            () -> service.ListPendingReviewRecruitments(1, 10, 100L, UserRoleEnum.STUDENT)
        );
    }

    @Test
    void NonAdminShouldNotQueryPendingReviewStatus() {
        UserMapper userMapper = mock(UserMapper.class);
        TeamRecruitmentMapper recruitmentMapper = mock(TeamRecruitmentMapper.class);
        TeamRecruitmentServiceImpl service = BuildService(
            recruitmentMapper,
            mock(TeamRecruitmentApplicationMapper.class),
            userMapper
        );
        when(userMapper.FindUserById(100L)).thenReturn(BuildUser(100L, UserRoleEnum.STUDENT));

        assertThrows(
            BusinessException.class,
            () -> service.ListRecruitments(1, 10, null, null, "PENDING_REVIEW", 100L)
        );
        verify(recruitmentMapper, never()).ListRecruitments(any(), any(), any(), any(), any());
    }

    @Test
    void ApplyRecruitmentShouldCreatePendingApplicationAndNotifyPublisher() {
        TeamRecruitmentMapper recruitmentMapper = mock(TeamRecruitmentMapper.class);
        TeamRecruitmentApplicationMapper applicationMapper = mock(TeamRecruitmentApplicationMapper.class);
        NotificationService notificationService = mock(NotificationService.class);
        TeamRecruitmentServiceImpl service = new TeamRecruitmentServiceImpl(
            recruitmentMapper,
            applicationMapper,
            mock(UserMapper.class),
            notificationService,
            mock(SystemRuleConfigService.class)
        );
        when(recruitmentMapper.FindRecruitmentById(10L)).thenReturn(BuildRecruitment(10L, 100L, TeamRecruitmentStatusEnum.RECRUITING));
        when(applicationMapper.FindApplicationByRecruitmentAndApplicant(10L, 200L)).thenReturn(null);

        assertEquals(10L, service.ApplyRecruitment(10L, null, 200L).GetRecruitmentId());
        verify(applicationMapper).InsertApplication(any());
        verify(notificationService).CreateNotification(eq(100L), any(), any(), any(), eq("TEAM_RECRUITMENT"), eq(10L));
    }

    private TeamRecruitmentServiceImpl BuildService(
        TeamRecruitmentMapper recruitmentMapper,
        TeamRecruitmentApplicationMapper applicationMapper,
        UserMapper userMapper
    ) {
        return new TeamRecruitmentServiceImpl(
            recruitmentMapper,
            applicationMapper,
            userMapper,
            mock(NotificationService.class),
            mock(SystemRuleConfigService.class)
        );
    }

    private TeamRecruitmentEntity BuildRecruitment(
        Long recruitmentId,
        Long publisherUserId,
        TeamRecruitmentStatusEnum status
    ) {
        TeamRecruitmentEntity recruitmentEntity = new TeamRecruitmentEntity();
        recruitmentEntity.SetRecruitmentId(recruitmentId);
        recruitmentEntity.SetPublisherUserId(publisherUserId);
        recruitmentEntity.SetEventName("Competition");
        recruitmentEntity.SetDirection("AI");
        recruitmentEntity.SetMemberLimit(3);
        recruitmentEntity.SetCurrentMemberCount(1);
        recruitmentEntity.SetRecruitmentStatus(status);
        recruitmentEntity.SetDeadline(LocalDateTime.now().plusDays(3));
        recruitmentEntity.SetCreateTime(LocalDateTime.now());
        return recruitmentEntity;
    }

    private UserEntity BuildUser(Long userId, UserRoleEnum userRole) {
        UserEntity userEntity = new UserEntity();
        userEntity.SetUserId(userId);
        userEntity.SetUserRole(userRole);
        return userEntity;
    }
}
