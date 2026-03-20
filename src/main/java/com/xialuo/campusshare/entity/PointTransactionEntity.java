package com.xialuo.campusshare.entity;

import com.xialuo.campusshare.enums.PointTransactionTypeEnum;
import java.time.LocalDateTime;

public class PointTransactionEntity extends BaseEntity {
    private Long transactionId;
    private Long accountId;
    private Long userId;
    private PointTransactionTypeEnum transactionType;
    private Integer changeAmount;
    private Integer balanceAfterChange;
    private String transactionRemark;
    private String sourceBizType;
    private Long sourceBizId;
    private LocalDateTime transactionTime;
}
