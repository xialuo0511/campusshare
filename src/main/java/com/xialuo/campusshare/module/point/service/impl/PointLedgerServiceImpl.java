package com.xialuo.campusshare.module.point.service.impl;

import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.entity.PointAccountEntity;
import com.xialuo.campusshare.entity.PointTransactionEntity;
import com.xialuo.campusshare.entity.UserEntity;
import com.xialuo.campusshare.enums.PointTransactionTypeEnum;
import com.xialuo.campusshare.module.point.mapper.PointAccountMapper;
import com.xialuo.campusshare.module.point.mapper.PointTransactionMapper;
import com.xialuo.campusshare.module.point.service.PointLedgerService;
import com.xialuo.campusshare.module.user.mapper.UserMapper;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 积分流水服务实现
 */
@Service
public class PointLedgerServiceImpl implements PointLedgerService {
    /** 最小有效积分变化值 */
    private static final Integer MIN_POINT_DELTA = 1;

    /** 积分账户Mapper */
    private final PointAccountMapper pointAccountMapper;
    /** 积分流水Mapper */
    private final PointTransactionMapper pointTransactionMapper;
    /** 用户Mapper */
    private final UserMapper userMapper;

    public PointLedgerServiceImpl(
        PointAccountMapper pointAccountMapper,
        PointTransactionMapper pointTransactionMapper,
        UserMapper userMapper
    ) {
        this.pointAccountMapper = pointAccountMapper;
        this.pointTransactionMapper = pointTransactionMapper;
        this.userMapper = userMapper;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void RecordUploadReward(
        Long userId,
        Integer pointDelta,
        String sourceBizType,
        Long sourceBizId,
        String transactionRemark
    ) {
        ValidatePointDelta(pointDelta);
        LocalDateTime operationTime = LocalDateTime.now();

        PointAccountEntity pointAccountEntity = GetOrInitPointAccount(userId);
        Integer updateRows = userMapper.IncreaseUserPointBalance(userId, pointDelta, operationTime);
        if (updateRows == null || updateRows <= 0) {
            throw new BusinessException(BizCodeEnum.USER_NOT_FOUND, "用户不存在");
        }

        Integer availablePoints = SafePoints(pointAccountEntity.GetAvailablePoints()) + pointDelta;
        Integer totalEarnedPoints = SafePoints(pointAccountEntity.GetTotalEarnedPoints()) + pointDelta;
        pointAccountEntity.SetAvailablePoints(availablePoints);
        pointAccountEntity.SetTotalEarnedPoints(totalEarnedPoints);
        pointAccountEntity.SetLastSettlementTime(operationTime);
        pointAccountEntity.SetUpdateTime(operationTime);
        pointAccountMapper.UpdatePointAccount(pointAccountEntity);

        CreatePointTransaction(
            pointAccountEntity.GetAccountId(),
            userId,
            PointTransactionTypeEnum.UPLOAD_REWARD,
            pointDelta,
            availablePoints,
            transactionRemark,
            sourceBizType,
            sourceBizId,
            operationTime
        );
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void RecordDownloadCost(
        Long userId,
        Integer pointDelta,
        String sourceBizType,
        Long sourceBizId,
        String transactionRemark
    ) {
        ValidatePointDelta(pointDelta);
        LocalDateTime operationTime = LocalDateTime.now();

        PointAccountEntity pointAccountEntity = GetOrInitPointAccount(userId);
        UserEntity userEntity = userMapper.FindUserById(userId);
        if (userEntity == null) {
            throw new BusinessException(BizCodeEnum.USER_NOT_FOUND, "用户不存在");
        }

        Integer latestUserBalance = SafePoints(userEntity.GetPointBalance());
        SyncPointAccountAvailable(pointAccountEntity, latestUserBalance, operationTime);
        if (latestUserBalance < pointDelta) {
            throw new BusinessException(BizCodeEnum.POINT_BALANCE_INSUFFICIENT, "积分余额不足");
        }

        Integer updateRows = userMapper.DecreaseUserPointBalanceIfEnough(userId, pointDelta, operationTime);
        if (updateRows == null || updateRows <= 0) {
            throw new BusinessException(BizCodeEnum.POINT_BALANCE_INSUFFICIENT, "积分余额不足");
        }

        Integer availablePoints = latestUserBalance - pointDelta;
        Integer totalConsumedPoints = SafePoints(pointAccountEntity.GetTotalConsumedPoints()) + pointDelta;
        pointAccountEntity.SetAvailablePoints(availablePoints);
        pointAccountEntity.SetTotalConsumedPoints(totalConsumedPoints);
        pointAccountEntity.SetLastSettlementTime(operationTime);
        pointAccountEntity.SetUpdateTime(operationTime);
        pointAccountMapper.UpdatePointAccount(pointAccountEntity);

        CreatePointTransaction(
            pointAccountEntity.GetAccountId(),
            userId,
            PointTransactionTypeEnum.DOWNLOAD_COST,
            -pointDelta,
            availablePoints,
            transactionRemark,
            sourceBizType,
            sourceBizId,
            operationTime
        );
    }

    /**
     * 获取并初始化积分账户
     */
    private PointAccountEntity GetOrInitPointAccount(Long userId) {
        PointAccountEntity pointAccountEntity = pointAccountMapper.FindByUserIdForUpdate(userId);
        if (pointAccountEntity != null) {
            return pointAccountEntity;
        }

        UserEntity userEntity = userMapper.FindUserById(userId);
        if (userEntity == null) {
            throw new BusinessException(BizCodeEnum.USER_NOT_FOUND, "用户不存在");
        }

        Integer userPointBalance = SafePoints(userEntity.GetPointBalance());
        LocalDateTime operationTime = LocalDateTime.now();

        PointAccountEntity newPointAccountEntity = new PointAccountEntity();
        newPointAccountEntity.SetUserId(userId);
        newPointAccountEntity.SetAvailablePoints(userPointBalance);
        newPointAccountEntity.SetTotalEarnedPoints(userPointBalance);
        newPointAccountEntity.SetTotalConsumedPoints(0);
        newPointAccountEntity.SetLastSettlementTime(operationTime);
        newPointAccountEntity.SetCreateTime(operationTime);
        newPointAccountEntity.SetUpdateTime(operationTime);
        newPointAccountEntity.SetDeleted(Boolean.FALSE);
        try {
            pointAccountMapper.InsertPointAccount(newPointAccountEntity);
        } catch (Exception exception) {
            // 并发初始化时由唯一索引兜底，继续走后续查询
        }

        PointAccountEntity insertedPointAccountEntity = pointAccountMapper.FindByUserIdForUpdate(userId);
        if (insertedPointAccountEntity == null) {
            throw new BusinessException(BizCodeEnum.SYSTEM_ERROR, "积分账户初始化失败");
        }
        return insertedPointAccountEntity;
    }

    /**
     * 创建积分流水
     */
    private void CreatePointTransaction(
        Long accountId,
        Long userId,
        PointTransactionTypeEnum transactionTypeEnum,
        Integer changeAmount,
        Integer balanceAfterChange,
        String transactionRemark,
        String sourceBizType,
        Long sourceBizId,
        LocalDateTime transactionTime
    ) {
        PointTransactionEntity pointTransactionEntity = new PointTransactionEntity();
        pointTransactionEntity.SetAccountId(accountId);
        pointTransactionEntity.SetUserId(userId);
        pointTransactionEntity.SetTransactionType(transactionTypeEnum);
        pointTransactionEntity.SetChangeAmount(changeAmount);
        pointTransactionEntity.SetBalanceAfterChange(balanceAfterChange);
        pointTransactionEntity.SetTransactionRemark(transactionRemark);
        pointTransactionEntity.SetSourceBizType(sourceBizType);
        pointTransactionEntity.SetSourceBizId(sourceBizId);
        pointTransactionEntity.SetTransactionTime(transactionTime);
        pointTransactionEntity.SetCreateTime(transactionTime);
        pointTransactionEntity.SetUpdateTime(transactionTime);
        pointTransactionEntity.SetDeleted(Boolean.FALSE);
        pointTransactionMapper.InsertPointTransaction(pointTransactionEntity);
    }

    /**
     * 同步账户可用积分
     */
    private void SyncPointAccountAvailable(
        PointAccountEntity pointAccountEntity,
        Integer latestUserBalance,
        LocalDateTime operationTime
    ) {
        Integer accountAvailablePoints = SafePoints(pointAccountEntity.GetAvailablePoints());
        if (accountAvailablePoints.equals(latestUserBalance)) {
            return;
        }
        pointAccountEntity.SetAvailablePoints(latestUserBalance);
        pointAccountEntity.SetUpdateTime(operationTime);
        pointAccountMapper.UpdatePointAccount(pointAccountEntity);
    }

    /**
     * 校验积分变动值
     */
    private void ValidatePointDelta(Integer pointDelta) {
        if (pointDelta == null || pointDelta < MIN_POINT_DELTA) {
            throw new BusinessException(BizCodeEnum.PARAM_INVALID, "积分变动值非法");
        }
    }

    /**
     * 兜底积分值
     */
    private Integer SafePoints(Integer points) {
        if (points == null || points < 0) {
            return 0;
        }
        return points;
    }
}
