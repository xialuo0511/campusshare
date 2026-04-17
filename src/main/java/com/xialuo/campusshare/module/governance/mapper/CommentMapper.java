package com.xialuo.campusshare.module.governance.mapper;

import com.xialuo.campusshare.entity.CommentEntity;
import java.time.LocalDateTime;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 评论数据映射接口
 */
@Mapper
public interface CommentMapper {
    /**
     * 按ID查询评论
     */
    CommentEntity FindCommentById(@Param("commentId") Long commentId);

    /**
     * 按ID统计评论
     */
    Long CountCommentById(@Param("commentId") Long commentId);

    /**
     * 隐藏评论
     */
    Integer HideComment(
        @Param("commentId") Long commentId,
        @Param("updateTime") LocalDateTime updateTime
    );
}
