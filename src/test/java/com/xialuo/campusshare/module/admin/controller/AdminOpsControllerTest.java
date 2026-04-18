package com.xialuo.campusshare.module.admin.controller;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import com.xialuo.campusshare.module.admin.dto.AdminOpsSummaryResponseDto;
import com.xialuo.campusshare.module.admin.service.AdminOpsService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 管理运行态接口测试
 */
class AdminOpsControllerTest {

    /**
     * 获取运行态总览应返回成功
     */
    @Test
    void GetOpsSummaryShouldReturnSuccess() {
        AdminOpsService adminOpsService = mock(AdminOpsService.class);
        AdminOpsController adminOpsController = new AdminOpsController(adminOpsService);
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getAttribute(RequestIdFilter.REQUEST_ID_ATTRIBUTE)).thenReturn("req-ops-1");

        AdminOpsSummaryResponseDto responseDto = new AdminOpsSummaryResponseDto();
        responseDto.SetOverallStatus("UP");
        responseDto.SetPendingMailTaskCount(9L);
        responseDto.SetFailedMailTaskCount(1L);
        when(adminOpsService.GetOpsSummary()).thenReturn(responseDto);

        ApiResponse<AdminOpsSummaryResponseDto> apiResponse = adminOpsController.GetOpsSummary(request);

        Assertions.assertEquals(0, apiResponse.GetCode());
        Assertions.assertNotNull(apiResponse.GetData());
        Assertions.assertEquals("UP", apiResponse.GetData().GetOverallStatus());
        Assertions.assertEquals(9L, apiResponse.GetData().GetPendingMailTaskCount());
        Assertions.assertEquals(1L, apiResponse.GetData().GetFailedMailTaskCount());
    }
}
