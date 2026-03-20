package com.xialuo.campusshare.entity;

/**
 * 评论实体
 */
public class CommentEntity extends BaseEntity {
    private Long commentId; // 评论ID
    private Long resourceId; // 资源ID
    private Long fromUserId; // 评论人ID
    private Long toUserId; // 被评论人ID
    private Integer score; // 评分
    private String content; // 评论内容
    private Boolean hiddenFlag; // 是否隐藏
}
