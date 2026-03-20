package com.xialuo.campusshare.entity;

import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.enums.UserStatusEnum;
import java.time.LocalDateTime;

public class UserEntity extends BaseEntity {
    private Long userId;
    private String account;
    private String passwordHash;
    private String displayName;
    private String email;
    private String phone;
    private String college;
    private String grade;
    private UserRoleEnum userRole;
    private UserStatusEnum userStatus;
    private Integer pointBalance;
    private LocalDateTime lastLoginTime;
}
