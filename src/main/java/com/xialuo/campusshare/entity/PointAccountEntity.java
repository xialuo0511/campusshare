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

    /**
     * 获取账户ID
     */
    public Long GetAccountId() {
        return accountId;
    }

    /**
     * 设置账户ID
     */
    public void SetAccountId(Long accountId) {
        this.accountId = accountId;
    }

    /**
     * 获取用户ID
     */
    public Long GetUserId() {
        return userId;
    }

    /**
     * 设置用户ID
     */
    public void SetUserId(Long userId) {
        this.userId = userId;
    }

    /**
     * 获取可用积分
     */
    public Integer GetAvailablePoints() {
        return availablePoints;
    }

    /**
     * 设置可用积分
     */
    public void SetAvailablePoints(Integer availablePoints) {
        this.availablePoints = availablePoints;
    }

    /**
     * 获取累计获得积分
     */
    public Integer GetTotalEarnedPoints() {
        return totalEarnedPoints;
    }

    /**
     * 设置累计获得积分
     */
    public void SetTotalEarnedPoints(Integer totalEarnedPoints) {
        this.totalEarnedPoints = totalEarnedPoints;
    }

    /**
     * 获取累计消耗积分
     */
    public Integer GetTotalConsumedPoints() {
        return totalConsumedPoints;
    }

    /**
     * 设置累计消耗积分
     */
    public void SetTotalConsumedPoints(Integer totalConsumedPoints) {
        this.totalConsumedPoints = totalConsumedPoints;
    }

    /**
     * 获取最近结算时间
     */
    public LocalDateTime GetLastSettlementTime() {
        return lastSettlementTime;
    }

    /**
     * 设置最近结算时间
     */
    public void SetLastSettlementTime(LocalDateTime lastSettlementTime) {
        this.lastSettlementTime = lastSettlementTime;
    }
}
