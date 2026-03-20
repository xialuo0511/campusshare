package com.xialuo.campusshare.module.resource.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

/**
 * 发布商品请求
 */
public class PublishProductRequestDto {
    /** 标题 */
    @NotBlank(message = "标题不能为空")
    @Size(min = 1, max = 50, message = "标题长度需在1到50")
    private String title;

    /** 分类 */
    @NotBlank(message = "分类不能为空")
    @Size(max = 50, message = "分类长度不能超过50")
    private String category;

    /** 成色 */
    @NotBlank(message = "成色不能为空")
    @Size(max = 20, message = "成色长度不能超过20")
    private String conditionLevel;

    /** 价格 */
    @NotNull(message = "价格不能为空")
    @DecimalMin(value = "0.00", message = "价格不能小于0")
    private BigDecimal price;

    /** 交易地点 */
    @NotBlank(message = "交易地点不能为空")
    @Size(min = 1, max = 100, message = "交易地点长度需在1到100")
    private String tradeLocation;

    /** 描述 */
    @Size(max = 1000, message = "描述长度不能超过1000")
    private String description;

    /** 图片文件ID列表 */
    @NotEmpty(message = "至少上传1张图片")
    @Size(min = 1, message = "至少上传1张图片")
    private List<String> imageFileIds;
}
