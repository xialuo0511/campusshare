package com.xialuo.campusshare.module.resource.dto;

import java.time.LocalDateTime;

/**
 * 商品评论响应
 */
public class ProductCommentResponseDto {
    /** 评论ID */
    private Long commentId;
    /** 商品ID */
    private Long productId;
    /** 评论人ID */
    private Long fromUserId;
    /** 评论人昵称 */
    private String fromUserDisplayName;
    /** 被评论人ID */
    private Long toUserId;
    /** 被评论人昵称 */
    private String toUserDisplayName;
    /** 评分 */
    private Integer score;
    /** 评论内容 */
    private String content;
    /** 评论时间 */
    private LocalDateTime createTime;

    /**
     * 获取评论ID
     */
    public Long GetCommentId() {
        return commentId;
    }

    /**
     * 设置评论ID
     */
    public void SetCommentId(Long commentId) {
        this.commentId = commentId;
    }

    /**
     * 获取商品ID
     */
    public Long GetProductId() {
        return productId;
    }

    /**
     * 设置商品ID
     */
    public void SetProductId(Long productId) {
        this.productId = productId;
    }

    /**
     * 获取评论人ID
     */
    public Long GetFromUserId() {
        return fromUserId;
    }

    /**
     * 设置评论人ID
     */
    public void SetFromUserId(Long fromUserId) {
        this.fromUserId = fromUserId;
    }

    /**
     * 获取评论人昵称
     */
    public String GetFromUserDisplayName() {
        return fromUserDisplayName;
    }

    /**
     * 设置评论人昵称
     */
    public void SetFromUserDisplayName(String fromUserDisplayName) {
        this.fromUserDisplayName = fromUserDisplayName;
    }

    /**
     * 获取被评论人ID
     */
    public Long GetToUserId() {
        return toUserId;
    }

    /**
     * 设置被评论人ID
     */
    public void SetToUserId(Long toUserId) {
        this.toUserId = toUserId;
    }

    /**
     * 获取被评论人昵称
     */
    public String GetToUserDisplayName() {
        return toUserDisplayName;
    }

    /**
     * 设置被评论人昵称
     */
    public void SetToUserDisplayName(String toUserDisplayName) {
        this.toUserDisplayName = toUserDisplayName;
    }

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
     * 获取评论时间
     */
    public LocalDateTime GetCreateTime() {
        return createTime;
    }

    /**
     * 设置评论时间
     */
    public void SetCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }
}

