package com.xialuo.campusshare.module.statistics.controller;

import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import com.xialuo.campusshare.module.statistics.dto.MarketOverviewResponseDto;
import com.xialuo.campusshare.module.statistics.service.MarketOverviewService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 市场总览接口
 */
@RestController
@RequestMapping("/api/v1/market")
public class MarketOverviewController {
    /** 市场总览服务 */
    private final MarketOverviewService marketOverviewService;

    public MarketOverviewController(MarketOverviewService marketOverviewService) {
        this.marketOverviewService = marketOverviewService;
    }

    /**
     * 获取首页总览数据
     */
    @GetMapping("/overview")
    public ApiResponse<MarketOverviewResponseDto> GetMarketOverview(HttpServletRequest httpServletRequest) {
        MarketOverviewResponseDto responseDto = marketOverviewService.GetMarketOverview();
        return ApiResponse.Success(responseDto, GetRequestId(httpServletRequest));
    }

    /**
     * 获取请求追踪ID
     */
    private String GetRequestId(HttpServletRequest httpServletRequest) {
        Object requestId = httpServletRequest.getAttribute(RequestIdFilter.REQUEST_ID_ATTRIBUTE);
        return requestId == null ? "" : requestId.toString();
    }
}
