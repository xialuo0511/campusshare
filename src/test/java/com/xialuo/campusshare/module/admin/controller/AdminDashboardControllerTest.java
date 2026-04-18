package com.xialuo.campusshare.module.admin.controller;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import com.xialuo.campusshare.module.admin.dto.AdminDashboardSummaryResponseDto;
import com.xialuo.campusshare.module.admin.service.AdminDashboardService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 管理看板接口测试
 */
class AdminDashboardControllerTest {

    /**
     * 获取看板应返回成功
     */
    @Test
    void GetDashboardSummaryShouldReturnSuccess() {
        AdminDashboardService adminDashboardService = mock(AdminDashboardService.class);
        AdminDashboardController controller = new AdminDashboardController(adminDashboardService);
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getAttribute(RequestIdFilter.REQUEST_ID_ATTRIBUTE)).thenReturn("req-dashboard-1");

        AdminDashboardSummaryResponseDto summaryResponseDto = new AdminDashboardSummaryResponseDto();
        summaryResponseDto.SetPendingUserReviewCount(3L);
        summaryResponseDto.SetPendingReportCount(5L);
        when(adminDashboardService.GetDashboardSummary()).thenReturn(summaryResponseDto);

        ApiResponse<AdminDashboardSummaryResponseDto> response = controller.GetDashboardSummary(request);

        Assertions.assertEquals(0, response.GetCode());
        Assertions.assertNotNull(response.GetData());
        Assertions.assertEquals(3L, response.GetData().GetPendingUserReviewCount());
        Assertions.assertEquals(5L, response.GetData().GetPendingReportCount());
    }
}
