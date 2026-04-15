package com.xialuo.campusshare.module.resource.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * 商品评论请求
 */
public class CreateProductCommentRequestDto {
    /** 评分 */
    @NotNull(message = "评分不能为空")
    @Min(value = 1, message = "评分最小为1")
    @Max(value = 5, message = "评分最大为5")
    private Integer score;

    /** 评论内容 */
    @NotBlank(message = "评论内容不能为空")
    @Size(min = 1, max = 500, message = "评论内容长度需在1到500")
    private String content;

    /** 被评论用户ID */
    @Positive(message = "被评论用户ID非法")
    private Long toUserId;

    /**
     * 获取评分
     */
    public Integer GetScore() {
        return score;
    }

    /**
     * 设置评分
     */
    public void SetScore(Integer score) {
        this.score = score;
    }

    /**
     * 获取评论内容
     */
    public String GetContent() {
        return content;
    }

    /**
     * 设置评论内容
     */
    public void SetContent(String content) {
        this.content = content;
    }

    /**
     * 获取被评论用户ID
     */
    public Long GetToUserId() {
        return toUserId;
    }

    /**
     * 设置被评论用户ID
     */
    public void SetToUserId(Long toUserId) {
        this.toUserId = toUserId;
    }
}

