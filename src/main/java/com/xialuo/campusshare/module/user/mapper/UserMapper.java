package com.xialuo.campusshare.module.user.mapper;

import com.xialuo.campusshare.entity.UserEntity;
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
}
