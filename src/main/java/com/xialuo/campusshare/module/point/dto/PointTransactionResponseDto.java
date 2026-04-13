package com.xialuo.campusshare.module.point.dto;

import com.xialuo.campusshare.enums.PointTransactionTypeEnum;
import java.time.LocalDateTime;

/**
 * 积分流水项响应
 */
public class PointTransactionResponseDto {
    /** 流水ID */
    private Long transactionId;
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

    /**
     * 获取流水ID
     */
    public Long GetTransactionId() {
        return transactionId;
    }

    /**
     * 设置流水ID
     */
    public void SetTransactionId(Long transactionId) {
        this.transactionId = transactionId;
    }

    /**
     * 获取流水类型
     */
    public PointTransactionTypeEnum GetTransactionType() {
        return transactionType;
    }

    /**
     * 设置流水类型
     */
    public void SetTransactionType(PointTransactionTypeEnum transactionType) {
        this.transactionType = transactionType;
    }

    /**
     * 获取变动值
     */
    public Integer GetChangeAmount() {
        return changeAmount;
    }

    /**
     * 设置变动值
     */
    public void SetChangeAmount(Integer changeAmount) {
        this.changeAmount = changeAmount;
    }

    /**
     * 获取变动后余额
     */
    public Integer GetBalanceAfterChange() {
        return balanceAfterChange;
    }

    /**
     * 设置变动后余额
     */
    public void SetBalanceAfterChange(Integer balanceAfterChange) {
        this.balanceAfterChange = balanceAfterChange;
    }

    /**
     * 获取备注
     */
    public String GetTransactionRemark() {
        return transactionRemark;
    }

    /**
     * 设置备注
     */
    public void SetTransactionRemark(String transactionRemark) {
        this.transactionRemark = transactionRemark;
    }

    /**
     * 获取来源业务类型
     */
    public String GetSourceBizType() {
        return sourceBizType;
    }

    /**
     * 设置来源业务类型
     */
    public void SetSourceBizType(String sourceBizType) {
        this.sourceBizType = sourceBizType;
    }

    /**
     * 获取来源业务ID
     */
    public Long GetSourceBizId() {
        return sourceBizId;
    }

    /**
     * 设置来源业务ID
     */
    public void SetSourceBizId(Long sourceBizId) {
        this.sourceBizId = sourceBizId;
    }

    /**
     * 获取交易时间
     */
    public LocalDateTime GetTransactionTime() {
        return transactionTime;
    }

    /**
     * 设置交易时间
     */
    public void SetTransactionTime(LocalDateTime transactionTime) {
        this.transactionTime = transactionTime;
    }
}

