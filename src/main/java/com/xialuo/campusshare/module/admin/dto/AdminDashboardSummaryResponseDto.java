package com.xialuo.campusshare.module.admin.dto;

/**
 * 管理后台总览统计响应
 */
public class AdminDashboardSummaryResponseDto {
    /** 用户总数 */
    private Long totalUserCount;
    /** 活跃用户数 */
    private Long activeUserCount;
    /** 冻结用户数 */
    private Long frozenUserCount;
    /** 待审核用户数 */
    private Long pendingUserReviewCount;
    /** 待审核卖家认证数 */
    private Long pendingSellerVerificationCount;

    /** 商品总数 */
    private Long totalProductCount;
    /** 已发布商品数 */
    private Long publishedProductCount;
    /** 锁定商品数 */
    private Long lockedProductCount;
    /** 下架商品数 */
    private Long offlineProductCount;

    /** 订单总数 */
    private Long totalOrderCount;
    /** 进行中订单数 */
    private Long ongoingOrderCount;
    /** 已完成订单数 */
    private Long completedOrderCount;
    /** 已取消订单数 */
    private Long canceledOrderCount;
    /** 已关闭订单数 */
    private Long closedOrderCount;

    /** 待处理举报数 */
    private Long pendingReportCount;
    /** 待审核资料数 */
    private Long pendingMaterialReviewCount;
    /** 待处理组队申请数 */
    private Long pendingTeamApplicationCount;

    /** 今日新增用户数 */
    private Long todayNewUserCount;
    /** 近7天新增用户数 */
    private Long sevenDayNewUserCount;
    /** 今日新增订单数 */
    private Long todayNewOrderCount;
    /** 近7天新增订单数 */
    private Long sevenDayNewOrderCount;
    /** 近7天举报数 */
    private Long sevenDayReportCount;
    /** 近7天审计日志数 */
    private Long sevenDayAuditCount;
    /** 近7天积分流水数 */
    private Long sevenDayPointTransactionCount;

    /**
     * 获取用户总数
     */
    public Long GetTotalUserCount() {
        return totalUserCount;
    }

    /**
     * 设置用户总数
     */
    public void SetTotalUserCount(Long totalUserCount) {
        this.totalUserCount = totalUserCount;
    }

    /**
     * 获取活跃用户数
     */
    public Long GetActiveUserCount() {
        return activeUserCount;
    }

    /**
     * 设置活跃用户数
     */
    public void SetActiveUserCount(Long activeUserCount) {
        this.activeUserCount = activeUserCount;
    }

    /**
     * 获取冻结用户数
     */
    public Long GetFrozenUserCount() {
        return frozenUserCount;
    }

    /**
     * 设置冻结用户数
     */
    public void SetFrozenUserCount(Long frozenUserCount) {
        this.frozenUserCount = frozenUserCount;
    }

    /**
     * 获取待审核用户数
     */
    public Long GetPendingUserReviewCount() {
        return pendingUserReviewCount;
    }

    /**
     * 设置待审核用户数
     */
    public void SetPendingUserReviewCount(Long pendingUserReviewCount) {
        this.pendingUserReviewCount = pendingUserReviewCount;
    }

    /**
     * 获取待审核卖家认证数
     */
    public Long GetPendingSellerVerificationCount() {
        return pendingSellerVerificationCount;
    }

    /**
     * 设置待审核卖家认证数
     */
    public void SetPendingSellerVerificationCount(Long pendingSellerVerificationCount) {
        this.pendingSellerVerificationCount = pendingSellerVerificationCount;
    }

    /**
     * 获取商品总数
     */
    public Long GetTotalProductCount() {
        return totalProductCount;
    }

    /**
     * 设置商品总数
     */
    public void SetTotalProductCount(Long totalProductCount) {
        this.totalProductCount = totalProductCount;
    }

    /**
     * 获取已发布商品数
     */
    public Long GetPublishedProductCount() {
        return publishedProductCount;
    }

    /**
     * 设置已发布商品数
     */
    public void SetPublishedProductCount(Long publishedProductCount) {
        this.publishedProductCount = publishedProductCount;
    }

    /**
     * 获取锁定商品数
     */
    public Long GetLockedProductCount() {
        return lockedProductCount;
    }

    /**
     * 设置锁定商品数
     */
    public void SetLockedProductCount(Long lockedProductCount) {
        this.lockedProductCount = lockedProductCount;
    }

    /**
     * 获取下架商品数
     */
    public Long GetOfflineProductCount() {
        return offlineProductCount;
    }

    /**
     * 设置下架商品数
     */
    public void SetOfflineProductCount(Long offlineProductCount) {
        this.offlineProductCount = offlineProductCount;
    }

    /**
     * 获取订单总数
     */
    public Long GetTotalOrderCount() {
        return totalOrderCount;
    }

    /**
     * 设置订单总数
     */
    public void SetTotalOrderCount(Long totalOrderCount) {
        this.totalOrderCount = totalOrderCount;
    }

    /**
     * 获取进行中订单数
     */
    public Long GetOngoingOrderCount() {
        return ongoingOrderCount;
    }

    /**
     * 设置进行中订单数
     */
    public void SetOngoingOrderCount(Long ongoingOrderCount) {
        this.ongoingOrderCount = ongoingOrderCount;
    }

    /**
     * 获取已完成订单数
     */
    public Long GetCompletedOrderCount() {
        return completedOrderCount;
    }

    /**
     * 设置已完成订单数
     */
    public void SetCompletedOrderCount(Long completedOrderCount) {
        this.completedOrderCount = completedOrderCount;
    }

    /**
     * 获取已取消订单数
     */
    public Long GetCanceledOrderCount() {
        return canceledOrderCount;
    }

    /**
     * 设置已取消订单数
     */
    public void SetCanceledOrderCount(Long canceledOrderCount) {
        this.canceledOrderCount = canceledOrderCount;
    }

    /**
     * 获取已关闭订单数
     */
    public Long GetClosedOrderCount() {
        return closedOrderCount;
    }

    /**
     * 设置已关闭订单数
     */
    public void SetClosedOrderCount(Long closedOrderCount) {
        this.closedOrderCount = closedOrderCount;
    }

    /**
     * 获取待处理举报数
     */
    public Long GetPendingReportCount() {
        return pendingReportCount;
    }

    /**
     * 设置待处理举报数
     */
    public void SetPendingReportCount(Long pendingReportCount) {
        this.pendingReportCount = pendingReportCount;
    }

    /**
     * 获取待审核资料数
     */
    public Long GetPendingMaterialReviewCount() {
        return pendingMaterialReviewCount;
    }

    /**
     * 设置待审核资料数
     */
    public void SetPendingMaterialReviewCount(Long pendingMaterialReviewCount) {
        this.pendingMaterialReviewCount = pendingMaterialReviewCount;
    }

    /**
     * 获取待处理组队申请数
     */
    public Long GetPendingTeamApplicationCount() {
        return pendingTeamApplicationCount;
    }

    /**
     * 设置待处理组队申请数
     */
    public void SetPendingTeamApplicationCount(Long pendingTeamApplicationCount) {
        this.pendingTeamApplicationCount = pendingTeamApplicationCount;
    }

    /**
     * 获取今日新增用户数
     */
    public Long GetTodayNewUserCount() {
        return todayNewUserCount;
    }

    /**
     * 设置今日新增用户数
     */
    public void SetTodayNewUserCount(Long todayNewUserCount) {
        this.todayNewUserCount = todayNewUserCount;
    }

    /**
     * 获取近7天新增用户数
     */
    public Long GetSevenDayNewUserCount() {
        return sevenDayNewUserCount;
    }

    /**
     * 设置近7天新增用户数
     */
    public void SetSevenDayNewUserCount(Long sevenDayNewUserCount) {
        this.sevenDayNewUserCount = sevenDayNewUserCount;
    }

    /**
     * 获取今日新增订单数
     */
    public Long GetTodayNewOrderCount() {
        return todayNewOrderCount;
    }

    /**
     * 设置今日新增订单数
     */
    public void SetTodayNewOrderCount(Long todayNewOrderCount) {
        this.todayNewOrderCount = todayNewOrderCount;
    }

    /**
     * 获取近7天新增订单数
     */
    public Long GetSevenDayNewOrderCount() {
        return sevenDayNewOrderCount;
    }

    /**
     * 设置近7天新增订单数
     */
    public void SetSevenDayNewOrderCount(Long sevenDayNewOrderCount) {
        this.sevenDayNewOrderCount = sevenDayNewOrderCount;
    }

    /**
     * 获取近7天举报数
     */
    public Long GetSevenDayReportCount() {
        return sevenDayReportCount;
    }

    /**
     * 设置近7天举报数
     */
    public void SetSevenDayReportCount(Long sevenDayReportCount) {
        this.sevenDayReportCount = sevenDayReportCount;
    }

    /**
     * 获取近7天审计日志数
     */
    public Long GetSevenDayAuditCount() {
        return sevenDayAuditCount;
    }

    /**
     * 设置近7天审计日志数
     */
    public void SetSevenDayAuditCount(Long sevenDayAuditCount) {
        this.sevenDayAuditCount = sevenDayAuditCount;
    }

    /**
     * 获取近7天积分流水数
     */
    public Long GetSevenDayPointTransactionCount() {
        return sevenDayPointTransactionCount;
    }

    /**
     * 设置近7天积分流水数
     */
    public void SetSevenDayPointTransactionCount(Long sevenDayPointTransactionCount) {
        this.sevenDayPointTransactionCount = sevenDayPointTransactionCount;
    }
}
