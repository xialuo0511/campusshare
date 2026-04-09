package com.xialuo.campusshare.module.governance.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 评论数据映射接口
 */
@Mapper
public interface CommentMapper {
    /**
     * 按ID统计评论
     */
    Long CountCommentById(@Param("commentId") Long commentId);
}
