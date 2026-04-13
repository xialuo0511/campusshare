package com.xialuo.campusshare.module.point.service.impl;

import com.xialuo.campusshare.common.api.PageQuery;
import com.xialuo.campusshare.entity.PointAccountEntity;
import com.xialuo.campusshare.entity.PointTransactionEntity;
import com.xialuo.campusshare.module.point.dto.PointLedgerResponseDto;
import com.xialuo.campusshare.module.point.dto.PointTransactionResponseDto;
import com.xialuo.campusshare.module.point.mapper.PointAccountMapper;
import com.xialuo.campusshare.module.point.mapper.PointTransactionMapper;
import com.xialuo.campusshare.module.point.service.PointQueryService;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * 积分查询服务实现
 */
@Service
public class PointQueryServiceImpl implements PointQueryService {
    /** 积分账户Mapper */
    private final PointAccountMapper pointAccountMapper;
    /** 积分流水Mapper */
    private final PointTransactionMapper pointTransactionMapper;

    public PointQueryServiceImpl(
        PointAccountMapper pointAccountMapper,
        PointTransactionMapper pointTransactionMapper
    ) {
        this.pointAccountMapper = pointAccountMapper;
        this.pointTransactionMapper = pointTransactionMapper;
    }

    @Override
    public PointLedgerResponseDto GetPointLedger(Long currentUserId, Integer pageNo, Integer pageSize) {
        Integer resolvedPageNo = ResolvePageNo(pageNo);
        Integer resolvedPageSize = ResolvePageSize(pageSize);
        Integer offset = (resolvedPageNo - 1) * resolvedPageSize;

        PointAccountEntity pointAccountEntity = pointAccountMapper.FindByUserId(currentUserId);
        List<PointTransactionResponseDto> transactionResponseList = pointTransactionMapper.ListByUserId(
            currentUserId,
            offset,
            resolvedPageSize
        ).stream().map(this::BuildPointTransactionResponse).toList();
        Long totalCount = SafeCount(pointTransactionMapper.CountByUserId(currentUserId));

        PointLedgerResponseDto responseDto = new PointLedgerResponseDto();
        responseDto.SetPageNo(resolvedPageNo);
        responseDto.SetPageSize(resolvedPageSize);
        responseDto.SetTotalCount(totalCount);
        responseDto.SetAvailablePoints(pointAccountEntity == null ? 0 : SafePoints(pointAccountEntity.GetAvailablePoints()));
        responseDto.SetTotalEarnedPoints(pointAccountEntity == null ? 0 : SafePoints(pointAccountEntity.GetTotalEarnedPoints()));
        responseDto.SetTotalConsumedPoints(pointAccountEntity == null ? 0 : SafePoints(pointAccountEntity.GetTotalConsumedPoints()));
        responseDto.SetTransactionList(transactionResponseList);
        return responseDto;
    }

    /**
     * 构建积分流水响应项
     */
    private PointTransactionResponseDto BuildPointTransactionResponse(PointTransactionEntity pointTransactionEntity) {
        PointTransactionResponseDto responseDto = new PointTransactionResponseDto();
        responseDto.SetTransactionId(pointTransactionEntity.GetTransactionId());
        responseDto.SetTransactionType(pointTransactionEntity.GetTransactionType());
        responseDto.SetChangeAmount(pointTransactionEntity.GetChangeAmount());
        responseDto.SetBalanceAfterChange(pointTransactionEntity.GetBalanceAfterChange());
        responseDto.SetTransactionRemark(pointTransactionEntity.GetTransactionRemark());
        responseDto.SetSourceBizType(pointTransactionEntity.GetSourceBizType());
        responseDto.SetSourceBizId(pointTransactionEntity.GetSourceBizId());
        responseDto.SetTransactionTime(pointTransactionEntity.GetTransactionTime());
        return responseDto;
    }

    /**
     * 解析页码
     */
    private Integer ResolvePageNo(Integer pageNo) {
        if (pageNo == null || pageNo < 1) {
            return PageQuery.DEFAULT_PAGE_NO;
        }
        return pageNo;
    }

    /**
     * 解析分页大小
     */
    private Integer ResolvePageSize(Integer pageSize) {
        if (pageSize == null || pageSize < 1) {
            return PageQuery.DEFAULT_PAGE_SIZE;
        }
        if (pageSize > PageQuery.MAX_PAGE_SIZE) {
            return PageQuery.MAX_PAGE_SIZE;
        }
        return pageSize;
    }

    /**
     * 兜底统计值
     */
    private Long SafeCount(Long totalCount) {
        return totalCount == null ? 0L : totalCount;
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

