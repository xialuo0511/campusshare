package com.xialuo.campusshare.module.user.service;

import com.xialuo.campusshare.module.user.dto.UserLoginRequestDto;
import com.xialuo.campusshare.module.user.dto.UserLoginResponseDto;
import com.xialuo.campusshare.module.user.dto.UserProfileResponseDto;
import com.xialuo.campusshare.module.user.dto.UserProfileUpdateRequestDto;
import com.xialuo.campusshare.module.user.dto.UserRegisterRequestDto;
import com.xialuo.campusshare.module.user.dto.UserRegisterResponseDto;
import com.xialuo.campusshare.module.user.dto.UserReviewRequestDto;
import com.xialuo.campusshare.module.user.dto.UserReviewResponseDto;
import java.util.List;

/**
 * 用户服务接口
 */
public interface UserService {
    /**
     * 提交注册
     */
    UserRegisterResponseDto RegisterUser(UserRegisterRequestDto requestDto);

    /**
     * 用户登录
     */
    UserLoginResponseDto LoginUser(UserLoginRequestDto requestDto);

    /**
     * 查询资料
     */
    UserProfileResponseDto GetUserProfile(Long userId);

    /**
     * 更新资料
     */
    UserProfileResponseDto UpdateUserProfile(Long userId, UserProfileUpdateRequestDto requestDto);

    /**
     * 审核用户
     */
    UserReviewResponseDto ReviewUser(UserReviewRequestDto requestDto, Long adminUserId);

    /**
     * 查询待审核用户
     */
    List<UserProfileResponseDto> ListPendingReviewUsers();
}
