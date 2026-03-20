package com.xialuo.campusshare.entity;

import java.time.LocalDateTime;

/**
 * 积分账户实体
 */
public class PointAccountEntity extends BaseEntity {
    /** 账户ID */
    private Long accountId;
    /** 用户ID */
    private Long userId;
    /** 可用积分 */
    private Integer availablePoints;
    /** 累计获得积分 */
    private Integer totalEarnedPoints;
    /** 累计消耗积分 */
    private Integer totalConsumedPoints;
    /** 最近结算时间 */
    private LocalDateTime lastSettlementTime;
}


