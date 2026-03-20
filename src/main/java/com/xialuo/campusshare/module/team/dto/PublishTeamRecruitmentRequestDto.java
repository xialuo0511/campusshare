package com.xialuo.campusshare.module.team.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

/**
 * 发布组队招募请求
 */
public class PublishTeamRecruitmentRequestDto {
    /** 赛事或项目名称 */
    @NotBlank(message = "赛事或项目名称不能为空")
    @Size(min = 1, max = 100, message = "赛事或项目名称长度需在1到100")
    private String eventName;

    /** 方向 */
    @NotBlank(message = "方向不能为空")
    @Size(min = 1, max = 50, message = "方向长度需在1到50")
    private String direction;

    /** 人数上限 */
    @NotNull(message = "人数上限不能为空")
    @Min(value = 1, message = "人数上限最小为1")
    private Integer memberLimit;

    /** 截止时间 */
    @NotNull(message = "截止时间不能为空")
    @Future(message = "截止时间必须晚于当前时间")
    private LocalDateTime deadline;

    /** 技能要求 */
    @Size(max = 500, message = "技能要求长度不能超过500")
    private String skillRequirement;
}
