package com.xialuo.campusshare.module.admin.service.impl;

import com.xialuo.campusshare.common.api.PageQuery;
import com.xialuo.campusshare.entity.AuditLogEntity;
import com.xialuo.campusshare.module.admin.dto.AuditLogListResponseDto;
import com.xialuo.campusshare.module.admin.dto.AuditLogResponseDto;
import com.xialuo.campusshare.module.admin.mapper.AuditLogMapper;
import com.xialuo.campusshare.module.admin.service.AuditLogService;
import java.time.LocalDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 审计日志服务实现
 */
@Service
public class AuditLogServiceImpl implements AuditLogService {
    /** 操作明细长度上限 */
    private static final Integer ACTION_DETAIL_MAX_LENGTH = 500;
    /** 日志 */
    private static final Logger LOGGER = LoggerFactory.getLogger(AuditLogServiceImpl.class);

    /** 审计日志Mapper */
    private final AuditLogMapper auditLogMapper;

    public AuditLogServiceImpl(AuditLogMapper auditLogMapper) {
        this.auditLogMapper = auditLogMapper;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void RecordAuditLog(
        Long operatorUserId,
        String actionType,
        String targetType,
        Long targetId,
        String actionResult,
        String actionDetail
    ) {
        if (operatorUserId == null || operatorUserId <= 0L) {
            return;
        }
        if (actionType == null || actionType.isBlank()) {
            return;
        }
        if (targetType == null || targetType.isBlank()) {
            return;
        }
        if (actionResult == null || actionResult.isBlank()) {
            return;
        }

        AuditLogEntity auditLogEntity = new AuditLogEntity();
        auditLogEntity.SetOperatorUserId(operatorUserId);
        auditLogEntity.SetActionType(actionType.trim().toUpperCase());
        auditLogEntity.SetTargetType(targetType.trim().toUpperCase());
        auditLogEntity.SetTargetId(targetId);
        auditLogEntity.SetActionResult(actionResult.trim().toUpperCase());
        auditLogEntity.SetActionDetail(TrimActionDetail(actionDetail));
        auditLogEntity.SetCreateTime(LocalDateTime.now());
        auditLogEntity.SetUpdateTime(LocalDateTime.now());
        auditLogEntity.SetDeleted(Boolean.FALSE);

        try {
            auditLogMapper.InsertAuditLog(auditLogEntity);
        } catch (Exception exception) {
            LOGGER.warn("Record audit log failed, operatorUserId={}, actionType={}, targetType={}, targetId={}",
                operatorUserId,
                actionType,
                targetType,
                targetId
            );
        }
    }

    @Override
    public AuditLogListResponseDto ListAuditLogs(
        Integer pageNo,
        Integer pageSize,
        Long operatorUserId,
        String actionType,
        String targetType,
        String actionResult
    ) {
        Integer resolvedPageNo = ResolvePageNo(pageNo);
        Integer resolvedPageSize = ResolvePageSize(pageSize);
        Integer offset = (resolvedPageNo - 1) * resolvedPageSize;

        String normalizedActionType = NormalizeFilterText(actionType);
        String normalizedTargetType = NormalizeFilterText(targetType);
        String normalizedActionResult = NormalizeFilterText(actionResult);

        List<AuditLogResponseDto> responseDtoList = auditLogMapper.ListAuditLogs(
            offset,
            resolvedPageSize,
            operatorUserId,
            normalizedActionType,
            normalizedTargetType,
            normalizedActionResult
        ).stream().map(this::BuildAuditLogResponse).toList();
        Long totalCount = auditLogMapper.CountAuditLogs(
            operatorUserId,
            normalizedActionType,
            normalizedTargetType,
            normalizedActionResult
        );

        AuditLogListResponseDto responseDto = new AuditLogListResponseDto();
        responseDto.SetPageNo(resolvedPageNo);
        responseDto.SetPageSize(resolvedPageSize);
        responseDto.SetTotalCount(totalCount == null ? 0L : totalCount);
        responseDto.SetAuditLogList(responseDtoList);
        return responseDto;
    }

    /**
     * 构建审计日志响应
     */
    private AuditLogResponseDto BuildAuditLogResponse(AuditLogEntity auditLogEntity) {
        AuditLogResponseDto responseDto = new AuditLogResponseDto();
        responseDto.SetAuditLogId(auditLogEntity.GetAuditLogId());
        responseDto.SetOperatorUserId(auditLogEntity.GetOperatorUserId());
        responseDto.SetActionType(auditLogEntity.GetActionType());
        responseDto.SetTargetType(auditLogEntity.GetTargetType());
        responseDto.SetTargetId(auditLogEntity.GetTargetId());
        responseDto.SetActionResult(auditLogEntity.GetActionResult());
        responseDto.SetActionDetail(auditLogEntity.GetActionDetail());
        responseDto.SetCreateTime(auditLogEntity.GetCreateTime());
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
     * 解析页大小
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
     * 规范化筛选文本
     */
    private String NormalizeFilterText(String text) {
        if (text == null) {
            return null;
        }
        String normalizedText = text.trim();
        if (normalizedText.isBlank()) {
            return null;
        }
        return normalizedText.toUpperCase();
    }

    /**
     * 裁剪操作明细
     */
    private String TrimActionDetail(String actionDetail) {
        if (actionDetail == null) {
            return null;
        }
        String normalizedDetail = actionDetail.trim();
        if (normalizedDetail.isBlank()) {
            return null;
        }
        if (normalizedDetail.length() <= ACTION_DETAIL_MAX_LENGTH) {
            return normalizedDetail;
        }
        return normalizedDetail.substring(0, ACTION_DETAIL_MAX_LENGTH);
    }
}

