package com.xialuo.campusshare.module.point.service;

import com.xialuo.campusshare.module.point.dto.PointLedgerResponseDto;

/**
 * 积分查询服务
 */
public interface PointQueryService {
    /**
     * 查询用户积分流水
     */
    PointLedgerResponseDto GetPointLedger(Long currentUserId, Integer pageNo, Integer pageSize);
}

