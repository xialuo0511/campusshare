package com.xialuo.campusshare.module.admin.service.impl;

import com.xialuo.campusshare.enums.OrderStatusEnum;
import com.xialuo.campusshare.module.admin.dto.AdminDashboardSummaryResponseDto;
import com.xialuo.campusshare.module.admin.mapper.AuditLogMapper;
import com.xialuo.campusshare.module.admin.service.AdminDashboardService;
import com.xialuo.campusshare.module.governance.mapper.ReportMapper;
import com.xialuo.campusshare.module.material.mapper.StudyMaterialMapper;
import com.xialuo.campusshare.module.order.mapper.OrderMapper;
import com.xialuo.campusshare.module.point.mapper.PointTransactionMapper;
import com.xialuo.campusshare.module.resource.mapper.ProductMapper;
import com.xialuo.campusshare.module.team.mapper.TeamRecruitmentApplicationMapper;
import com.xialuo.campusshare.module.user.mapper.SellerVerificationMapper;
import com.xialuo.campusshare.module.user.mapper.UserMapper;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * 管理后台看板服务实现
 */
@Service
public class AdminDashboardServiceImpl implements AdminDashboardService {
    /** 用户Mapper */
    private final UserMapper userMapper;
    /** 卖家认证Mapper */
    private final SellerVerificationMapper sellerVerificationMapper;
    /** 商品Mapper */
    private final ProductMapper productMapper;
    /** 订单Mapper */
    private final OrderMapper orderMapper;
    /** 举报Mapper */
    private final ReportMapper reportMapper;
    /** 资料Mapper */
    private final StudyMaterialMapper studyMaterialMapper;
    /** 组队申请Mapper */
    private final TeamRecruitmentApplicationMapper teamRecruitmentApplicationMapper;
    /** 审计日志Mapper */
    private final AuditLogMapper auditLogMapper;
    /** 积分流水Mapper */
    private final PointTransactionMapper pointTransactionMapper;

    public AdminDashboardServiceImpl(
        UserMapper userMapper,
        SellerVerificationMapper sellerVerificationMapper,
        ProductMapper productMapper,
        OrderMapper orderMapper,
        ReportMapper reportMapper,
        StudyMaterialMapper studyMaterialMapper,
        TeamRecruitmentApplicationMapper teamRecruitmentApplicationMapper,
        AuditLogMapper auditLogMapper,
        PointTransactionMapper pointTransactionMapper
    ) {
        this.userMapper = userMapper;
        this.sellerVerificationMapper = sellerVerificationMapper;
        this.productMapper = productMapper;
        this.orderMapper = orderMapper;
        this.reportMapper = reportMapper;
        this.studyMaterialMapper = studyMaterialMapper;
        this.teamRecruitmentApplicationMapper = teamRecruitmentApplicationMapper;
        this.auditLogMapper = auditLogMapper;
        this.pointTransactionMapper = pointTransactionMapper;
    }

    @Override
    public AdminDashboardSummaryResponseDto GetDashboardSummary() {
        LocalDateTime todayStartTime = LocalDate.now().atStartOfDay();
        LocalDateTime sevenDayStartTime = LocalDate.now().minusDays(6).atStartOfDay();

        AdminDashboardSummaryResponseDto responseDto = new AdminDashboardSummaryResponseDto();

        responseDto.SetTotalUserCount(SafeCount(userMapper.CountUsersByFilter(null, null, null)));
        responseDto.SetActiveUserCount(SafeCount(userMapper.CountUsersByFilter(null, "ACTIVE", null)));
        responseDto.SetFrozenUserCount(SafeCount(userMapper.CountUsersByFilter(null, "FROZEN", null)));
        responseDto.SetPendingUserReviewCount(SafeCount(userMapper.CountUsersByFilter(null, "PENDING_REVIEW", null)));
        responseDto.SetPendingSellerVerificationCount(SafeCount((long) SafeSize(sellerVerificationMapper.ListPendingApplications())));

        responseDto.SetTotalProductCount(SafeCount(productMapper.CountProductsForAdmin(null, null, null, null)));
        responseDto.SetPublishedProductCount(SafeCount(productMapper.CountProductsForAdmin(null, null, "PUBLISHED", null)));
        responseDto.SetLockedProductCount(SafeCount(productMapper.CountProductsForAdmin(null, null, "LOCKED", null)));
        responseDto.SetOfflineProductCount(SafeCount(productMapper.CountProductsForAdmin(null, null, "OFFLINE", null)));

        responseDto.SetTotalOrderCount(SafeCount(orderMapper.CountOrdersByUser(0L, Boolean.TRUE, null)));
        responseDto.SetOngoingOrderCount(
            SafeCount(orderMapper.CountOrdersByUserAndStatus(0L, Boolean.TRUE, OrderStatusEnum.PENDING_SELLER_CONFIRM))
                + SafeCount(orderMapper.CountOrdersByUserAndStatus(0L, Boolean.TRUE, OrderStatusEnum.PENDING_OFFLINE_TRADE))
                + SafeCount(orderMapper.CountOrdersByUserAndStatus(0L, Boolean.TRUE, OrderStatusEnum.PENDING_BUYER_CONFIRM))
        );
        responseDto.SetCompletedOrderCount(
            SafeCount(orderMapper.CountOrdersByUserAndStatus(0L, Boolean.TRUE, OrderStatusEnum.COMPLETED))
        );
        responseDto.SetCanceledOrderCount(
            SafeCount(orderMapper.CountOrdersByUserAndStatus(0L, Boolean.TRUE, OrderStatusEnum.CANCELED))
        );
        responseDto.SetClosedOrderCount(
            SafeCount(orderMapper.CountOrdersByUserAndStatus(0L, Boolean.TRUE, OrderStatusEnum.CLOSED))
        );

        responseDto.SetPendingReportCount(SafeCount((long) SafeSize(reportMapper.ListPendingReports())));
        responseDto.SetPendingMaterialReviewCount(SafeCount(studyMaterialMapper.CountPendingReviewMaterials()));
        responseDto.SetPendingTeamApplicationCount(
            SafeCount((long) SafeSize(teamRecruitmentApplicationMapper.ListPendingApplications()))
        );

        responseDto.SetTodayNewUserCount(SafeCount(userMapper.CountUsersCreatedAfter(todayStartTime)));
        responseDto.SetSevenDayNewUserCount(SafeCount(userMapper.CountUsersCreatedAfter(sevenDayStartTime)));
        responseDto.SetTodayNewOrderCount(SafeCount(orderMapper.CountOrdersCreatedAfter(todayStartTime)));
        responseDto.SetSevenDayNewOrderCount(SafeCount(orderMapper.CountOrdersCreatedAfter(sevenDayStartTime)));
        responseDto.SetSevenDayReportCount(SafeCount(reportMapper.CountReportsCreatedAfter(sevenDayStartTime)));
        responseDto.SetSevenDayAuditCount(SafeCount(auditLogMapper.CountAuditLogsCreatedAfter(sevenDayStartTime)));
        responseDto.SetSevenDayPointTransactionCount(
            SafeCount(pointTransactionMapper.CountTransactionsCreatedAfter(sevenDayStartTime))
        );

        return responseDto;
    }

    /**
     * 计数兜底
     */
    private Long SafeCount(Long count) {
        return count == null ? 0L : count;
    }

    /**
     * 列表长度兜底
     */
    private Integer SafeSize(List<?> itemList) {
        return itemList == null ? 0 : itemList.size();
    }
}
