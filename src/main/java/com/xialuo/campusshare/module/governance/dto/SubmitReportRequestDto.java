package com.xialuo.campusshare.module.governance.dto;

import com.xialuo.campusshare.module.governance.enums.ReportTargetTypeEnum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * 提交举报请求
 */
public class SubmitReportRequestDto {
    /** 举报对象类型 */
    @NotNull(message = "举报对象类型不能为空")
    private ReportTargetTypeEnum targetType;

    /** 举报对象ID */
    @NotNull(message = "举报对象ID不能为空")
    private Long targetId;

    /** 原因分类 */
    @NotBlank(message = "原因分类不能为空")
    @Size(max = 50, message = "原因分类长度不能超过50")
    private String reasonCategory;

    /** 补充说明 */
    @Size(max = 500, message = "补充说明长度不能超过500")
    private String detail;

    /** 证据文件ID列表 */
    @NotEmpty(message = "至少上传1个证据")
    private List<String> evidenceFileIds;

    /**
     * 获取对象类型
     */
    public ReportTargetTypeEnum GetTargetType() {
        return targetType;
    }

    /**
     * 设置对象类型
     */
    public void SetTargetType(ReportTargetTypeEnum targetType) {
        this.targetType = targetType;
    }

    /**
     * 获取对象ID
     */
    public Long GetTargetId() {
        return targetId;
    }

    /**
     * 设置对象ID
     */
    public void SetTargetId(Long targetId) {
        this.targetId = targetId;
    }

    /**
     * 获取原因分类
     */
    public String GetReasonCategory() {
        return reasonCategory;
    }

    /**
     * 设置原因分类
     */
    public void SetReasonCategory(String reasonCategory) {
        this.reasonCategory = reasonCategory;
    }

    /**
     * 获取补充说明
     */
    public String GetDetail() {
        return detail;
    }

    /**
     * 设置补充说明
     */
    public void SetDetail(String detail) {
        this.detail = detail;
    }

    /**
     * 获取证据文件ID列表
     */
    public List<String> GetEvidenceFileIds() {
        return evidenceFileIds;
    }

    /**
     * 设置证据文件ID列表
     */
    public void SetEvidenceFileIds(List<String> evidenceFileIds) {
        this.evidenceFileIds = evidenceFileIds;
    }
}
