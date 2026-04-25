package com.xialuo.campusshare.module.user.service;

import com.xialuo.campusshare.module.user.dto.UserLoginRequestDto;
import com.xialuo.campusshare.module.user.dto.UserLoginResponseDto;
import com.xialuo.campusshare.module.user.dto.UserAvatarReviewRequestDto;
import com.xialuo.campusshare.module.user.dto.UserAvatarUploadRequestDto;
import com.xialuo.campusshare.module.user.dto.UserProfilePageResponseDto;
import com.xialuo.campusshare.module.user.dto.UserProfileResponseDto;
import com.xialuo.campusshare.module.user.dto.UserProfileUpdateRequestDto;
import com.xialuo.campusshare.module.user.dto.UserRegisterCodeRequestDto;
import com.xialuo.campusshare.module.user.dto.UserRegisterCodeResponseDto;
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
     * 发送注册邮箱验证码
     */
    UserRegisterCodeResponseDto SendRegisterCode(UserRegisterCodeRequestDto requestDto);

    /**
     * 提交注册
     */
    UserRegisterResponseDto RegisterUser(UserRegisterRequestDto requestDto);

    /**
     * 用户登录
     */
    UserLoginResponseDto LoginUser(UserLoginRequestDto requestDto);

    /**
     * 用户登出
     */
    void LogoutUser(String token);

    /**
     * 查询资料
     */
    UserProfileResponseDto GetUserProfile(Long userId);

    /**
     * 更新资料
     */
    UserProfileResponseDto UpdateUserProfile(Long userId, UserProfileUpdateRequestDto requestDto);

    /**
     * 提交头像审核
     */
    UserProfileResponseDto SubmitAvatarReview(Long userId, UserAvatarUploadRequestDto requestDto);

    /**
     * 审核头像
     */
    UserProfileResponseDto ReviewUserAvatar(Long userId, UserAvatarReviewRequestDto requestDto, Long adminUserId);

    /**
     * 审核用户
     */
    UserReviewResponseDto ReviewUser(UserReviewRequestDto requestDto, Long adminUserId);

    /**
     * 查询待审核用户
     */
    List<UserProfileResponseDto> ListPendingReviewUsers();

    /**
     * 查询待审核头像用户
     */
    List<UserProfileResponseDto> ListPendingAvatarReviewUsers();

    /**
     * 分页查询用户
     */
    UserProfilePageResponseDto ListUsers(
        Integer pageNo,
        Integer pageSize,
        String keyword,
        String userStatus,
        String userRole
    );

    /**
     * 冻结用户
     */
    UserProfileResponseDto FreezeUser(Long userId, Long adminUserId);

    /**
     * 解冻用户
     */
    UserProfileResponseDto UnfreezeUser(Long userId);
}
