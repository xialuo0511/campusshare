package com.xialuo.campusshare.entity;

import java.time.LocalDateTime;

/**
 * 积分账户实体
 */
public class PointAccountEntity extends BaseEntity {
    private Long accountId; // 账户ID
    private Long userId; // 用户ID
    private Integer availablePoints; // 可用积分
    private Integer totalEarnedPoints; // 累计获得积分
    private Integer totalConsumedPoints; // 累计消耗积分
    private LocalDateTime lastSettlementTime; // 最近结算时间
}
