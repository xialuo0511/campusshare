package com.xialuo.campusshare.entity;

import com.xialuo.campusshare.enums.ResourceStatusEnum;
import com.xialuo.campusshare.enums.ResourceTypeEnum;
import java.time.LocalDateTime;

public class ResourceEntity extends BaseEntity {
    private Long resourceId;
    private Long publisherUserId;
    private ResourceTypeEnum resourceType;
    private String title;
    private String description;
    private ResourceStatusEnum resourceStatus;
    private Integer viewCount;
    private Integer favoriteCount;
    private Integer commentCount;
    private LocalDateTime publishTime;
    private LocalDateTime expireTime;
}
