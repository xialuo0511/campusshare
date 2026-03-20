package com.xialuo.campusshare.entity;

import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.enums.UserStatusEnum;
import java.time.LocalDateTime;

/**
 * 用户实体
 */
public class UserEntity extends BaseEntity {
    private Long userId; // 用户ID
    private String account; // 账号
    private String passwordHash; // 密码哈希
    private String displayName; // 昵称
    private String email; // 邮箱
    private String phone; // 手机号
    private String college; // 学院
    private String grade; // 年级
    private UserRoleEnum userRole; // 用户角色
    private UserStatusEnum userStatus; // 用户状态
    private Integer pointBalance; // 积分余额
    private LocalDateTime lastLoginTime; // 最近登录时间
}
