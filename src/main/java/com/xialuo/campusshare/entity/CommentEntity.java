package com.xialuo.campusshare.entity;

public class CommentEntity extends BaseEntity {
    private Long commentId;
    private Long resourceId;
    private Long fromUserId;
    private Long toUserId;
    private Integer score;
    private String content;
    private Boolean hiddenFlag;
}
