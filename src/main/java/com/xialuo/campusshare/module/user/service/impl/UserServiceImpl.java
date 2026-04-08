package com.xialuo.campusshare.module.user.service.impl;

import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.entity.UserEntity;
import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.enums.UserStatusEnum;
import com.xialuo.campusshare.module.user.dto.UserLoginRequestDto;
import com.xialuo.campusshare.module.user.dto.UserLoginResponseDto;
import com.xialuo.campusshare.module.user.dto.UserProfileResponseDto;
import com.xialuo.campusshare.module.user.dto.UserProfileUpdateRequestDto;
import com.xialuo.campusshare.module.user.dto.UserRegisterRequestDto;
import com.xialuo.campusshare.module.user.dto.UserRegisterResponseDto;
import com.xialuo.campusshare.module.user.dto.UserReviewRequestDto;
import com.xialuo.campusshare.module.user.dto.UserReviewResponseDto;
import com.xialuo.campusshare.module.user.repository.UserMemoryRepository;
import com.xialuo.campusshare.module.user.service.UserService;
import com.xialuo.campusshare.module.user.util.PasswordUtil;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

/**
 * 用户服务实现
 */
@Service
public class UserServiceImpl implements UserService {
    /** 默认积分 */
    private static final Integer DEFAULT_POINT_BALANCE = 0;

    /** 用户仓储 */
    private final UserMemoryRepository userMemoryRepository;

    public UserServiceImpl(UserMemoryRepository userMemoryRepository) {
        this.userMemoryRepository = userMemoryRepository;
    }

    @Override
    public UserRegisterResponseDto RegisterUser(UserRegisterRequestDto requestDto) {
        if (userMemoryRepository.ExistsByAccount(requestDto.GetAccount())) {
            throw new BusinessException(BizCodeEnum.ACCOUNT_EXISTS, "账号已存在");
        }

        UserEntity userEntity = new UserEntity();
        userEntity.SetAccount(requestDto.GetAccount());
        userEntity.SetPasswordHash(PasswordUtil.HashPassword(requestDto.GetPassword()));
        userEntity.SetDisplayName(requestDto.GetDisplayName());
        userEntity.SetCollege(requestDto.GetCollege());
        userEntity.SetGrade(requestDto.GetGrade());
        userEntity.SetPhone(requestDto.GetContact());
        userEntity.SetPointBalance(DEFAULT_POINT_BALANCE);
        userEntity.SetUserStatus(UserStatusEnum.PENDING_REVIEW);
        userEntity.SetUserRole(UserRoleEnum.VISITOR);
        userEntity.SetCreateTime(LocalDateTime.now());
        userEntity.SetUpdateTime(LocalDateTime.now());
        userEntity.SetDeleted(Boolean.FALSE);

        UserEntity savedUserEntity = userMemoryRepository.SaveUser(userEntity);

        UserRegisterResponseDto responseDto = new UserRegisterResponseDto();
        responseDto.SetUserId(savedUserEntity.GetUserId());
        responseDto.SetUserStatus(savedUserEntity.GetUserStatus());
        responseDto.SetTip("注册成功，请等待管理员审核");
        return responseDto;
    }

    @Override
    public UserLoginResponseDto LoginUser(UserLoginRequestDto requestDto) {
        UserEntity userEntity = userMemoryRepository.FindUserByAccount(requestDto.GetAccount());
        if (userEntity == null) {
            throw new BusinessException(BizCodeEnum.USER_NOT_FOUND, "用户不存在");
        }
        if (!PasswordUtil.VerifyPassword(requestDto.GetPassword(), userEntity.GetPasswordHash())) {
            throw new BusinessException(BizCodeEnum.PASSWORD_INVALID, "密码错误");
        }
        if (userEntity.GetUserStatus() != UserStatusEnum.ACTIVE) {
            throw new BusinessException(BizCodeEnum.ACCOUNT_NOT_ACTIVE, "账号未审核通过");
        }

        userEntity.SetLastLoginTime(LocalDateTime.now());
        userEntity.SetUpdateTime(LocalDateTime.now());
        userMemoryRepository.SaveUser(userEntity);

        String token = UUID.randomUUID().toString().replace("-", "");
        userMemoryRepository.SaveSession(token, userEntity.GetUserId());

        UserLoginResponseDto responseDto = new UserLoginResponseDto();
        responseDto.SetUserId(userEntity.GetUserId());
        responseDto.SetAccount(userEntity.GetAccount());
        responseDto.SetDisplayName(userEntity.GetDisplayName());
        responseDto.SetUserRole(userEntity.GetUserRole());
        responseDto.SetToken(token);
        return responseDto;
    }

    @Override
    public UserProfileResponseDto GetUserProfile(Long userId) {
        UserEntity userEntity = userMemoryRepository.FindUserById(userId);
        if (userEntity == null) {
            throw new BusinessException(BizCodeEnum.USER_NOT_FOUND, "用户不存在");
        }
        return BuildUserProfileResponse(userEntity);
    }

    @Override
    public UserProfileResponseDto UpdateUserProfile(Long userId, UserProfileUpdateRequestDto requestDto) {
        UserEntity userEntity = userMemoryRepository.FindUserById(userId);
        if (userEntity == null) {
            throw new BusinessException(BizCodeEnum.USER_NOT_FOUND, "用户不存在");
        }
        if (userEntity.GetUserStatus() != UserStatusEnum.ACTIVE) {
            throw new BusinessException(BizCodeEnum.ACCOUNT_NOT_ACTIVE, "当前状态不允许修改资料");
        }

        userEntity.SetDisplayName(requestDto.GetDisplayName());
        userEntity.SetCollege(requestDto.GetCollege());
        userEntity.SetGrade(requestDto.GetGrade());
        userEntity.SetPhone(requestDto.GetPhone());
        userEntity.SetEmail(requestDto.GetEmail());
        userEntity.SetUpdateTime(LocalDateTime.now());
        userMemoryRepository.SaveUser(userEntity);

        return BuildUserProfileResponse(userEntity);
    }

    @Override
    public UserReviewResponseDto ReviewUser(UserReviewRequestDto requestDto) {
        UserEntity userEntity = userMemoryRepository.FindUserById(requestDto.GetUserId());
        if (userEntity == null) {
            throw new BusinessException(BizCodeEnum.USER_NOT_FOUND, "用户不存在");
        }

        if (Boolean.TRUE.equals(requestDto.GetApproved())) {
            userEntity.SetUserStatus(UserStatusEnum.ACTIVE);
            userEntity.SetUserRole(UserRoleEnum.STUDENT);
        } else {
            userEntity.SetUserStatus(UserStatusEnum.REJECTED);
            userEntity.SetUserRole(UserRoleEnum.VISITOR);
        }
        userEntity.SetUpdateTime(LocalDateTime.now());
        userMemoryRepository.SaveUser(userEntity);

        UserReviewResponseDto responseDto = new UserReviewResponseDto();
        responseDto.SetUserId(userEntity.GetUserId());
        responseDto.SetUserStatus(userEntity.GetUserStatus());
        responseDto.SetAdminUserId(requestDto.GetAdminUserId());
        responseDto.SetReviewRemark(requestDto.GetReviewRemark());
        responseDto.SetReviewTime(LocalDateTime.now());
        return responseDto;
    }

    @Override
    public List<UserProfileResponseDto> ListPendingReviewUsers() {
        return userMemoryRepository.FindAllUsers().stream()
            .filter(userEntity -> userEntity.GetUserStatus() == UserStatusEnum.PENDING_REVIEW)
            .map(this::BuildUserProfileResponse)
            .toList();
    }

    /**
     * 构建资料响应
     */
    private UserProfileResponseDto BuildUserProfileResponse(UserEntity userEntity) {
        UserProfileResponseDto responseDto = new UserProfileResponseDto();
        responseDto.SetUserId(userEntity.GetUserId());
        responseDto.SetAccount(userEntity.GetAccount());
        responseDto.SetDisplayName(userEntity.GetDisplayName());
        responseDto.SetCollege(userEntity.GetCollege());
        responseDto.SetGrade(userEntity.GetGrade());
        responseDto.SetPhone(userEntity.GetPhone());
        responseDto.SetEmail(userEntity.GetEmail());
        responseDto.SetUserRole(userEntity.GetUserRole());
        responseDto.SetUserStatus(userEntity.GetUserStatus());
        responseDto.SetPointBalance(userEntity.GetPointBalance());
        responseDto.SetLastLoginTime(userEntity.GetLastLoginTime());
        return responseDto;
    }
}
