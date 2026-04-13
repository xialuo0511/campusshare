package com.xialuo.campusshare.module.point.service;

/**
 * 积分流水服务
 */
public interface PointLedgerService {
    /**
     * 记录上传奖励积分
     */
    void RecordUploadReward(
        Long userId,
        Integer pointDelta,
        String sourceBizType,
        Long sourceBizId,
        String transactionRemark
    );

    /**
     * 记录下载扣减积分
     */
    void RecordDownloadCost(
        Long userId,
        Integer pointDelta,
        String sourceBizType,
        Long sourceBizId,
        String transactionRemark
    );
}

