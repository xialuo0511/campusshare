package com.xialuo.campusshare.entity;

import com.xialuo.campusshare.enums.PointTransactionTypeEnum;
import java.time.LocalDateTime;

/**
 * 积分流水实体
 */
public class PointTransactionEntity extends BaseEntity {
    private Long transactionId; // 流水ID
    private Long accountId; // 账户ID
    private Long userId; // 用户ID
    private PointTransactionTypeEnum transactionType; // 流水类型
    private Integer changeAmount; // 变动值
    private Integer balanceAfterChange; // 变动后余额
    private String transactionRemark; // 备注
    private String sourceBizType; // 来源业务类型
    private Long sourceBizId; // 来源业务ID
    private LocalDateTime transactionTime; // 交易时间
}
