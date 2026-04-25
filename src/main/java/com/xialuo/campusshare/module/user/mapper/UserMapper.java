package com.xialuo.campusshare.module.user.mapper;

import com.xialuo.campusshare.entity.UserEntity;
import java.time.LocalDateTime;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 用户数据映射接口
 */
@Mapper
public interface UserMapper {
    /**
     * 新增用户
     */
    Integer InsertUser(UserEntity userEntity);

    /**
     * 更新用户
     */
    Integer UpdateUser(UserEntity userEntity);

    /**
     * 按ID查询用户
     */
    UserEntity FindUserById(@Param("userId") Long userId);

    /**
     * 按账号查询用户
     */
    UserEntity FindUserByAccount(@Param("account") String account);

    /**
     * 按账号统计
     */
    Long CountByAccount(@Param("account") String account);

    /**
     * 查询待审核用户
     */
    List<UserEntity> ListPendingReviewUsers();

    /**
     * 查询待审核头像用户
     */
    List<UserEntity> ListPendingAvatarReviewUsers();

    /**
     * 分页查询用户
     */
    List<UserEntity> ListUsersByFilterPaged(
        @Param("keyword") String keyword,
        @Param("userStatus") String userStatus,
        @Param("userRole") String userRole,
        @Param("offset") Integer offset,
        @Param("limit") Integer limit
    );

    /**
     * 统计用户数量
     */
    Long CountUsersByFilter(
        @Param("keyword") String keyword,
        @Param("userStatus") String userStatus,
        @Param("userRole") String userRole
    );

    /**
     * 统计指定时间后的新增用户
     */
    Long CountUsersCreatedAfter(@Param("startTime") LocalDateTime startTime);

    /**
     * 增加用户积分
     */
    Integer IncreaseUserPointBalance(
        @Param("userId") Long userId,
        @Param("pointDelta") Integer pointDelta,
        @Param("updateTime") LocalDateTime updateTime
    );

    /**
     * 扣减用户积分
     */
    Integer DecreaseUserPointBalanceIfEnough(
        @Param("userId") Long userId,
        @Param("pointDelta") Integer pointDelta,
        @Param("updateTime") LocalDateTime updateTime
    );

    /**
     * 查询有效管理员用户ID
     */
    List<Long> ListActiveAdministratorUserIds();
}
