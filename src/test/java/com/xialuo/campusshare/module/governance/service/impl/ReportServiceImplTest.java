package com.xialuo.campusshare.module.governance.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.entity.ProductEntity;
import com.xialuo.campusshare.entity.ReportEntity;
import com.xialuo.campusshare.entity.UserEntity;
import com.xialuo.campusshare.enums.NotificationTypeEnum;
import com.xialuo.campusshare.enums.ReportStatusEnum;
import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.enums.UserStatusEnum;
import com.xialuo.campusshare.module.governance.dto.ReportReviewRequestDto;
import com.xialuo.campusshare.module.governance.enums.ReportDispositionActionEnum;
import com.xialuo.campusshare.module.governance.enums.ReportTargetTypeEnum;
import com.xialuo.campusshare.module.governance.mapper.CommentMapper;
import com.xialuo.campusshare.module.governance.mapper.ReportMapper;
import com.xialuo.campusshare.module.material.mapper.StudyMaterialMapper;
import com.xialuo.campusshare.module.notification.service.NotificationService;
import com.xialuo.campusshare.module.order.mapper.OrderMapper;
import com.xialuo.campusshare.module.resource.mapper.ProductMapper;
import com.xialuo.campusshare.module.user.mapper.UserMapper;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;

/**
 * Report service governance tests.
 */
class ReportServiceImplTest {

    @Test
    void ThirdPartyShouldNotReadReportDetail() {
        ReportMapper reportMapper = mock(ReportMapper.class);
        ReportServiceImpl service = BuildService(reportMapper, mock(UserMapper.class), mock(ProductMapper.class), mock(OrderMapper.class));
        when(reportMapper.FindReportById(10L)).thenReturn(BuildReport(10L, 100L, ReportTargetTypeEnum.USER, 200L));

        assertThrows(
            BusinessException.class,
            () -> service.GetReportDetail(10L, 300L, UserRoleEnum.STUDENT)
        );
    }

    @Test
    void ApprovedUserReportShouldFreezeTargetUserAndNotifyReporter() {
        ReportMapper reportMapper = mock(ReportMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        NotificationService notificationService = mock(NotificationService.class);
        ReportServiceImpl service = new ReportServiceImpl(
            reportMapper,
            mock(CommentMapper.class),
            notificationService,
            userMapper,
            mock(ProductMapper.class),
            mock(StudyMaterialMapper.class),
            mock(OrderMapper.class)
        );
        ReportReviewRequestDto requestDto = BuildReviewRequest(Boolean.TRUE, ReportDispositionActionEnum.FREEZE_USER.name());
        UserEntity targetUser = BuildUser(200L, UserRoleEnum.STUDENT, UserStatusEnum.ACTIVE);

        when(reportMapper.FindReportById(10L)).thenReturn(BuildReport(10L, 100L, ReportTargetTypeEnum.USER, 200L));
        when(userMapper.FindUserById(200L)).thenReturn(targetUser);

        assertEquals(ReportStatusEnum.CLOSED, service.ReviewReport(10L, requestDto, 1L).GetReportStatus());
        assertEquals(UserStatusEnum.FROZEN, targetUser.GetUserStatus());
        verify(userMapper).UpdateUser(targetUser);
        verify(notificationService).CreateNotification(eq(100L), eq(NotificationTypeEnum.REVIEW), any(), any(), eq("REPORT"), eq(10L));
    }

    @Test
    void ReportShouldRejectFreezingAdministrator() {
        ReportMapper reportMapper = mock(ReportMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        ReportServiceImpl service = BuildService(reportMapper, userMapper, mock(ProductMapper.class), mock(OrderMapper.class));
        ReportReviewRequestDto requestDto = BuildReviewRequest(Boolean.TRUE, ReportDispositionActionEnum.FREEZE_USER.name());

        when(reportMapper.FindReportById(10L)).thenReturn(BuildReport(10L, 100L, ReportTargetTypeEnum.USER, 200L));
        when(userMapper.FindUserById(200L)).thenReturn(BuildUser(200L, UserRoleEnum.ADMINISTRATOR, UserStatusEnum.ACTIVE));

        assertThrows(BusinessException.class, () -> service.ReviewReport(10L, requestDto, 1L));
        verify(reportMapper, never()).UpdateReport(any());
    }

    @Test
    void ApprovedResourceReportShouldOfflineProductAndCloseOngoingOrders() {
        ReportMapper reportMapper = mock(ReportMapper.class);
        ProductMapper productMapper = mock(ProductMapper.class);
        OrderMapper orderMapper = mock(OrderMapper.class);
        ReportServiceImpl service = BuildService(reportMapper, mock(UserMapper.class), productMapper, orderMapper);
        ReportReviewRequestDto requestDto = BuildReviewRequest(Boolean.TRUE, ReportDispositionActionEnum.OFFLINE_RESOURCE.name());

        when(reportMapper.FindReportById(10L)).thenReturn(BuildReport(10L, 100L, ReportTargetTypeEnum.RESOURCE, 300L));
        when(productMapper.FindProductById(300L)).thenReturn(new ProductEntity());

        service.ReviewReport(10L, requestDto, 1L);

        verify(orderMapper).CloseOngoingOrdersByProductId(eq(300L), any(), any(LocalDateTime.class), any(LocalDateTime.class));
        verify(productMapper).ForceOfflineProduct(eq(300L), any(LocalDateTime.class));
    }

    private ReportServiceImpl BuildService(
        ReportMapper reportMapper,
        UserMapper userMapper,
        ProductMapper productMapper,
        OrderMapper orderMapper
    ) {
        return new ReportServiceImpl(
            reportMapper,
            mock(CommentMapper.class),
            mock(NotificationService.class),
            userMapper,
            productMapper,
            mock(StudyMaterialMapper.class),
            orderMapper
        );
    }

    private ReportReviewRequestDto BuildReviewRequest(Boolean approved, String action) {
        ReportReviewRequestDto requestDto = new ReportReviewRequestDto();
        requestDto.SetApproved(approved);
        requestDto.SetDispositionAction(action);
        requestDto.SetReviewRemark("checked");
        return requestDto;
    }

    private ReportEntity BuildReport(
        Long reportId,
        Long reporterUserId,
        ReportTargetTypeEnum targetType,
        Long targetId
    ) {
        ReportEntity reportEntity = new ReportEntity();
        reportEntity.SetReportId(reportId);
        reportEntity.SetReporterUserId(reporterUserId);
        reportEntity.SetTargetType(targetType);
        reportEntity.SetTargetId(targetId);
        reportEntity.SetReasonCategory("spam");
        reportEntity.SetReportStatus(ReportStatusEnum.PENDING_REVIEW);
        return reportEntity;
    }

    private UserEntity BuildUser(Long userId, UserRoleEnum userRole, UserStatusEnum userStatus) {
        UserEntity userEntity = new UserEntity();
        userEntity.SetUserId(userId);
        userEntity.SetUserRole(userRole);
        userEntity.SetUserStatus(userStatus);
        return userEntity;
    }
}
