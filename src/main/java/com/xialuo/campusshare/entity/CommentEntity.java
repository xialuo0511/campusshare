package com.xialuo.campusshare.entity;

/**
 * 评论实体
 */
public class CommentEntity extends BaseEntity {
    /** 评论ID */
    private Long commentId;
    /** 资源ID */
    private Long resourceId;
    /** 评论人ID */
    private Long fromUserId;
    /** 被评论人ID */
    private Long toUserId;
    /** 评分 */
    private Integer score;
    /** 评论内容 */
    private String content;
    /** 是否隐藏 */
    private Boolean hiddenFlag;
}


