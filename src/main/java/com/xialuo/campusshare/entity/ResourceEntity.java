package com.xialuo.campusshare.entity;

import com.xialuo.campusshare.enums.ResourceStatusEnum;
import com.xialuo.campusshare.enums.ResourceTypeEnum;
import java.time.LocalDateTime;

/**
 * 资源抽象实体
 */
public class ResourceEntity extends BaseEntity {
    private Long resourceId; // 资源ID
    private Long publisherUserId; // 发布者ID
    private ResourceTypeEnum resourceType; // 资源类型
    private String title; // 标题
    private String description; // 描述
    private ResourceStatusEnum resourceStatus; // 资源状态
    private Integer viewCount; // 浏览次数
    private Integer favoriteCount; // 收藏次数
    private Integer commentCount; // 评论次数
    private LocalDateTime publishTime; // 发布时间
    private LocalDateTime expireTime; // 过期时间
}
