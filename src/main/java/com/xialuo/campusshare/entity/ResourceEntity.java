package com.xialuo.campusshare.entity;

import com.xialuo.campusshare.enums.ResourceStatusEnum;
import com.xialuo.campusshare.enums.ResourceTypeEnum;
import java.time.LocalDateTime;

/**
 * 资源抽象实体
 */
public class ResourceEntity extends BaseEntity {
    /** 资源ID */
    private Long resourceId;
    /** 发布者ID */
    private Long publisherUserId;
    /** 资源类型 */
    private ResourceTypeEnum resourceType;
    /** 标题 */
    private String title;
    /** 描述 */
    private String description;
    /** 资源状态 */
    private ResourceStatusEnum resourceStatus;
    /** 浏览次数 */
    private Integer viewCount;
    /** 收藏次数 */
    private Integer favoriteCount;
    /** 评论次数 */
    private Integer commentCount;
    /** 发布时间 */
    private LocalDateTime publishTime;
    /** 过期时间 */
    private LocalDateTime expireTime;
}


