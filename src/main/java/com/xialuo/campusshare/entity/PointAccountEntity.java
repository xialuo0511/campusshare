package com.xialuo.campusshare.entity;

import java.time.LocalDateTime;

public class PointAccountEntity extends BaseEntity {
    private Long accountId;
    private Long userId;
    private Integer availablePoints;
    private Integer totalEarnedPoints;
    private Integer totalConsumedPoints;
    private LocalDateTime lastSettlementTime;
}
