package com.xialuo.campusshare.module.governance.mapper;

import com.xialuo.campusshare.entity.ReportEntity;
import com.xialuo.campusshare.module.governance.enums.ReportTargetTypeEnum;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 举报数据映射接口
 */
@Mapper
public interface ReportMapper {
    /**
     * 新增举报
     */
    Integer InsertReport(ReportEntity reportEntity);

    /**
     * 更新举报
     */
    Integer UpdateReport(ReportEntity reportEntity);

    /**
     * 按ID查询举报
     */
    ReportEntity FindReportById(@Param("reportId") Long reportId);

    /**
     * 查询待处理举报
     */
    List<ReportEntity> ListPendingReports();

    /**
     * 按对象查询同类待处理举报
     */
    ReportEntity FindPendingReportByTarget(
        @Param("targetType") ReportTargetTypeEnum targetType,
        @Param("targetId") Long targetId,
        @Param("reasonCategory") String reasonCategory
    );
}
