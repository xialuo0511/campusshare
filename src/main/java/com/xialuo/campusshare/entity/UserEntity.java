package com.xialuo.campusshare.entity;

import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.enums.UserStatusEnum;
import java.time.LocalDateTime;

/**
 * 用户实体
 */
public class UserEntity extends BaseEntity {
    /** 用户ID */
    private Long userId;
    /** 账号 */
    private String account;
    /** 密码哈希 */
    private String passwordHash;
    /** 昵称 */
    private String displayName;
    /** 邮箱 */
    private String email;
    /** 手机号 */
    private String phone;
    /** 学院 */
    private String college;
    /** 年级 */
    private String grade;
    /** 用户角色 */
    private UserRoleEnum userRole;
    /** 用户状态 */
    private UserStatusEnum userStatus;
    /** 积分余额 */
    private Integer pointBalance;
    /** 最近登录时间 */
    private LocalDateTime lastLoginTime;
}


