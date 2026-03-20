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
}
