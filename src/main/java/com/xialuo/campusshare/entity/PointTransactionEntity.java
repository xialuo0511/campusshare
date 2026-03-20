package com.xialuo.campusshare.entity;

import com.xialuo.campusshare.enums.PointTransactionTypeEnum;
import java.time.LocalDateTime;

/**
 * 积分流水实体
 */
public class PointTransactionEntity extends BaseEntity {
    /** 流水ID */
    private Long transactionId;
    /** 账户ID */
    private Long accountId;
    /** 用户ID */
    private Long userId;
    /** 流水类型 */
    private PointTransactionTypeEnum transactionType;
    /** 变动值 */
    private Integer changeAmount;
    /** 变动后余额 */
    private Integer balanceAfterChange;
    /** 备注 */
    private String transactionRemark;
    /** 来源业务类型 */
    private String sourceBizType;
    /** 来源业务ID */
    private Long sourceBizId;
    /** 交易时间 */
    private LocalDateTime transactionTime;
}


