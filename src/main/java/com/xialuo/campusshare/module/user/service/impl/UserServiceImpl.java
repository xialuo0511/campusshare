package com.xialuo.campusshare.module.user.service.impl;

import com.xialuo.campusshare.common.api.PageQuery;
import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.entity.UserEntity;
import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.enums.UserStatusEnum;
import com.xialuo.campusshare.module.user.dto.UserLoginRequestDto;
import com.xialuo.campusshare.module.user.dto.UserLoginResponseDto;
import com.xialuo.campusshare.module.user.dto.UserProfilePageResponseDto;
import com.xialuo.campusshare.module.user.dto.UserProfileResponseDto;
import com.xialuo.campusshare.module.user.dto.UserProfileUpdateRequestDto;
import com.xialuo.campusshare.module.user.dto.UserRegisterCodeRequestDto;
import com.xialuo.campusshare.module.user.dto.UserRegisterCodeResponseDto;
import com.xialuo.campusshare.module.user.dto.UserRegisterRequestDto;
import com.xialuo.campusshare.module.user.dto.UserRegisterResponseDto;
import com.xialuo.campusshare.module.user.dto.UserReviewRequestDto;
import com.xialuo.campusshare.module.user.dto.UserReviewResponseDto;
import com.xialuo.campusshare.module.user.mapper.UserMapper;
import com.xialuo.campusshare.module.user.service.UserService;
import com.xialuo.campusshare.module.user.util.PasswordUtil;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * 用户服务实现
 */
@Service
public class UserServiceImpl implements UserService {
    /** 默认积分 */
    private static final Integer DEFAULT_POINT_BALANCE = 0;
    /** 会话缓存前缀 */
    private static final String USER_SESSION_PREFIX = "campusshare:user:session:";
    /** 会话有效时长 */
    private static final Duration USER_SESSION_TTL = Duration.ofDays(7);
    /** 注册验证码缓存前缀 */
    private static final String REGISTER_CODE_PREFIX = "campusshare:user:register:code:";
    /** 验证码发送限频前缀 */
    private static final String REGISTER_CODE_COOLDOWN_PREFIX = "campusshare:user:register:code:cooldown:";
    /** 验证码有效时长 */
    private static final Duration REGISTER_CODE_TTL = Duration.ofMinutes(5);
    /** 验证码发送最小间隔 */
    private static final Duration REGISTER_CODE_COOLDOWN = Duration.ofSeconds(60);
    /** 邮件主题 */
    private static final String REGISTER_CODE_MAIL_SUBJECT = "CampusShare 注册验证码";

    /** 日志 */
    private static final Logger LOGGER = LoggerFactory.getLogger(UserServiceImpl.class);
    /** 随机数 */
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    /** 用户Mapper */
    private final UserMapper userMapper;
    /** Redis模板 */
    private final StringRedisTemplate stringRedisTemplate;
    /** 邮件发送器 */
    private final JavaMailSender javaMailSender;
    /** 邮件发送人 */
    private final String registerCodeMailFrom;
    /** 验证码回退日志开关 */
    private final Boolean registerCodeLogEnabled;

    public UserServiceImpl(
        UserMapper userMapper,
        StringRedisTemplate stringRedisTemplate,
        ObjectProvider<JavaMailSender> javaMailSenderProvider,
        @Value("${campusshare.mail.register.from:noreply@campusshare.local}") String registerCodeMailFrom,
        @Value("${campusshare.mail.register.log-code-enabled:true}") Boolean registerCodeLogEnabled
    ) {
        this.userMapper = userMapper;
        this.stringRedisTemplate = stringRedisTemplate;
        this.javaMailSender = javaMailSenderProvider.getIfAvailable();
        this.registerCodeMailFrom = registerCodeMailFrom;
        this.registerCodeLogEnabled = registerCodeLogEnabled;
    }

    @Override
    public UserRegisterCodeResponseDto SendRegisterCode(UserRegisterCodeRequestDto requestDto) {
        String account = NormalizeAccount(requestDto.GetAccount());
        String email = NormalizeEmail(requestDto.GetEmail());
        if (userMapper.CountByAccount(account) > 0) {
            throw new BusinessException(BizCodeEnum.ACCOUNT_EXISTS, "账号已存在");
        }
        ValidateSendFrequency(account);

        String verificationCode = BuildVerificationCode();
        String registerCodeKey = BuildRegisterCodeKey(account);
        try {
            stringRedisTemplate.opsForValue().set(registerCodeKey, verificationCode, REGISTER_CODE_TTL);
            stringRedisTemplate.opsForValue().set(BuildRegisterCodeCooldownKey(account), "1", REGISTER_CODE_COOLDOWN);
        } catch (Exception exception) {
            throw new BusinessException(BizCodeEnum.SYSTEM_ERROR, "验证码暂时不可用，请稍后重试");
        }

        boolean mailSent = TrySendRegisterCodeEmail(email, account, verificationCode);
        UserRegisterCodeResponseDto responseDto = new UserRegisterCodeResponseDto();
        if (mailSent) {
            responseDto.SetTip("验证码已发送，请查收邮箱");
        } else {
            if (Boolean.TRUE.equals(registerCodeLogEnabled)) {
                LOGGER.info("注册验证码回退日志: account={}, email={}, code={}", account, email, verificationCode);
                responseDto.SetTip("邮件通道暂不可用，验证码已输出到服务日志");
            } else {
                responseDto.SetTip("邮件通道暂不可用，请联系管理员处理");
            }
        }
        return responseDto;
    }

    @Override
    public UserRegisterResponseDto RegisterUser(UserRegisterRequestDto requestDto) {
        String account = NormalizeAccount(requestDto.GetAccount());
        if (userMapper.CountByAccount(account) > 0) {
            throw new BusinessException(BizCodeEnum.ACCOUNT_EXISTS, "账号已存在");
        }
        ValidateRegisterCode(account, requestDto.GetVerificationCode());

        UserEntity userEntity = new UserEntity();
        userEntity.SetAccount(account);
        userEntity.SetPasswordHash(PasswordUtil.HashPassword(requestDto.GetPassword()));
        userEntity.SetDisplayName(requestDto.GetDisplayName());
        userEntity.SetCollege(requestDto.GetCollege());
        userEntity.SetGrade(requestDto.GetGrade());
        userEntity.SetPhone(requestDto.GetContact());
        userEntity.SetEmail(NormalizeEmail(requestDto.GetContact()));
        userEntity.SetPointBalance(DEFAULT_POINT_BALANCE);
        userEntity.SetUserStatus(UserStatusEnum.PENDING_REVIEW);
        userEntity.SetUserRole(UserRoleEnum.VISITOR);
        userEntity.SetCreateTime(LocalDateTime.now());
        userEntity.SetUpdateTime(LocalDateTime.now());
        userEntity.SetDeleted(Boolean.FALSE);

        userMapper.InsertUser(userEntity);
        DeleteRegisterCode(account);

        UserRegisterResponseDto responseDto = new UserRegisterResponseDto();
        responseDto.SetUserId(userEntity.GetUserId());
        responseDto.SetUserStatus(userEntity.GetUserStatus());
        responseDto.SetTip("注册成功，请等待管理员审核");
        return responseDto;
    }

    @Override
    public UserLoginResponseDto LoginUser(UserLoginRequestDto requestDto) {
        UserEntity userEntity = userMapper.FindUserByAccount(requestDto.GetAccount());
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
        userMapper.UpdateUser(userEntity);

        String token = UUID.randomUUID().toString().replace("-", "");
        SaveUserSession(token, userEntity.GetUserId());

        UserLoginResponseDto responseDto = new UserLoginResponseDto();
        responseDto.SetUserId(userEntity.GetUserId());
        responseDto.SetAccount(userEntity.GetAccount());
        responseDto.SetDisplayName(userEntity.GetDisplayName());
        responseDto.SetUserRole(userEntity.GetUserRole());
        responseDto.SetToken(token);
        return responseDto;
    }

    @Override
    public void LogoutUser(String token) {
        DeleteUserSession(token);
    }

    @Override
    public UserProfileResponseDto GetUserProfile(Long userId) {
        UserEntity userEntity = userMapper.FindUserById(userId);
        if (userEntity == null) {
            throw new BusinessException(BizCodeEnum.USER_NOT_FOUND, "用户不存在");
        }
        return BuildUserProfileResponse(userEntity);
    }

    @Override
    public UserProfileResponseDto UpdateUserProfile(Long userId, UserProfileUpdateRequestDto requestDto) {
        UserEntity userEntity = userMapper.FindUserById(userId);
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
        userMapper.UpdateUser(userEntity);

        return BuildUserProfileResponse(userEntity);
    }

    @Override
    public UserReviewResponseDto ReviewUser(UserReviewRequestDto requestDto, Long adminUserId) {
        UserEntity userEntity = userMapper.FindUserById(requestDto.GetUserId());
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
        userMapper.UpdateUser(userEntity);

        UserReviewResponseDto responseDto = new UserReviewResponseDto();
        responseDto.SetUserId(userEntity.GetUserId());
        responseDto.SetUserStatus(userEntity.GetUserStatus());
        responseDto.SetAdminUserId(adminUserId);
        responseDto.SetReviewRemark(requestDto.GetReviewRemark());
        responseDto.SetReviewTime(LocalDateTime.now());
        return responseDto;
    }

    @Override
    public List<UserProfileResponseDto> ListPendingReviewUsers() {
        return userMapper.ListPendingReviewUsers().stream()
            .map(this::BuildUserProfileResponse)
            .toList();
    }

    @Override
    public UserProfilePageResponseDto ListUsers(
        Integer pageNo,
        Integer pageSize,
        String keyword,
        String userStatus,
        String userRole
    ) {
        Integer resolvedPageNo = ResolvePageNo(pageNo);
        Integer resolvedPageSize = ResolvePageSize(pageSize);
        Integer offset = (resolvedPageNo - 1) * resolvedPageSize;
        String resolvedKeyword = NormalizeKeyword(keyword);
        String resolvedUserStatus = ResolveUserStatus(userStatus);
        String resolvedUserRole = ResolveUserRole(userRole);

        List<UserProfileResponseDto> userList = userMapper.ListUsersByFilterPaged(
            resolvedKeyword,
            resolvedUserStatus,
            resolvedUserRole,
            offset,
            resolvedPageSize
        ).stream().map(this::BuildUserProfileResponse).toList();
        Long totalCount = userMapper.CountUsersByFilter(
            resolvedKeyword,
            resolvedUserStatus,
            resolvedUserRole
        );

        UserProfilePageResponseDto responseDto = new UserProfilePageResponseDto();
        responseDto.SetPageNo(resolvedPageNo);
        responseDto.SetPageSize(resolvedPageSize);
        responseDto.SetTotalCount(totalCount == null ? 0L : totalCount);
        responseDto.SetUserList(userList);
        return responseDto;
    }

    @Override
    public UserProfileResponseDto FreezeUser(Long userId, Long adminUserId) {
        UserEntity userEntity = userMapper.FindUserById(userId);
        if (userEntity == null) {
            throw new BusinessException(BizCodeEnum.USER_NOT_FOUND, "用户不存在");
        }
        if (adminUserId != null && adminUserId.equals(userId)) {
            throw new BusinessException(BizCodeEnum.FORBIDDEN, "不支持冻结当前登录管理员");
        }
        if (userEntity.GetUserRole() == UserRoleEnum.ADMINISTRATOR) {
            throw new BusinessException(BizCodeEnum.FORBIDDEN, "管理员账号不支持冻结");
        }
        if (userEntity.GetUserStatus() != UserStatusEnum.FROZEN) {
            userEntity.SetUserStatus(UserStatusEnum.FROZEN);
            userEntity.SetUpdateTime(LocalDateTime.now());
            userMapper.UpdateUser(userEntity);
        }
        return BuildUserProfileResponse(userEntity);
    }

    @Override
    public UserProfileResponseDto UnfreezeUser(Long userId) {
        UserEntity userEntity = userMapper.FindUserById(userId);
        if (userEntity == null) {
            throw new BusinessException(BizCodeEnum.USER_NOT_FOUND, "用户不存在");
        }
        if (userEntity.GetUserRole() == UserRoleEnum.ADMINISTRATOR) {
            throw new BusinessException(BizCodeEnum.FORBIDDEN, "管理员账号无需解冻");
        }
        if (userEntity.GetUserStatus() != UserStatusEnum.FROZEN) {
            throw new BusinessException(BizCodeEnum.BUSINESS_CONFLICT, "当前账号非冻结状态");
        }
        userEntity.SetUserStatus(UserStatusEnum.ACTIVE);
        userEntity.SetUpdateTime(LocalDateTime.now());
        userMapper.UpdateUser(userEntity);
        return BuildUserProfileResponse(userEntity);
    }

    /**
     * 校验发送频率
     */
    private void ValidateSendFrequency(String account) {
        String cooldownValue = null;
        try {
            cooldownValue = stringRedisTemplate.opsForValue().get(BuildRegisterCodeCooldownKey(account));
        } catch (Exception exception) {
            // Redis异常不阻断发送
        }
        if (cooldownValue != null && !cooldownValue.isBlank()) {
            throw new BusinessException(BizCodeEnum.BUSINESS_CONFLICT, "验证码发送过于频繁，请稍后再试");
        }
    }

    /**
     * 校验注册验证码
     */
    private void ValidateRegisterCode(String account, String verificationCode) {
        String codeFromCache;
        try {
            codeFromCache = stringRedisTemplate.opsForValue().get(BuildRegisterCodeKey(account));
        } catch (Exception exception) {
            throw new BusinessException(BizCodeEnum.SYSTEM_ERROR, "验证码服务异常");
        }
        if (codeFromCache == null || codeFromCache.isBlank()) {
            throw new BusinessException(BizCodeEnum.REGISTER_CODE_EXPIRED, "验证码已过期，请重新获取");
        }
        if (!codeFromCache.equals(verificationCode == null ? "" : verificationCode.trim())) {
            throw new BusinessException(BizCodeEnum.REGISTER_CODE_INVALID, "验证码错误");
        }
    }

    /**
     * 删除注册验证码
     */
    private void DeleteRegisterCode(String account) {
        try {
            stringRedisTemplate.delete(BuildRegisterCodeKey(account));
            stringRedisTemplate.delete(BuildRegisterCodeCooldownKey(account));
        } catch (Exception exception) {
            // Redis异常不阻断主流程
        }
    }

    /**
     * 尝试发送验证码邮件
     */
    private boolean TrySendRegisterCodeEmail(String email, String account, String verificationCode) {
        if (javaMailSender == null) {
            return false;
        }
        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom(registerCodeMailFrom);
            mailMessage.setTo(email);
            mailMessage.setSubject(REGISTER_CODE_MAIL_SUBJECT);
            mailMessage.setText(BuildRegisterCodeMailText(account, verificationCode));
            javaMailSender.send(mailMessage);
            return true;
        } catch (Exception exception) {
            LOGGER.warn("发送注册验证码邮件失败: account={}, email={}", account, email, exception);
            return false;
        }
    }

    /**
     * 构建邮件内容
     */
    private String BuildRegisterCodeMailText(String account, String verificationCode) {
        return "你好，\n\n"
            + "你正在 CampusShare 注册账号。\n"
            + "学号/工号: " + account + "\n"
            + "验证码: " + verificationCode + "\n"
            + "有效期: 5 分钟。\n\n"
            + "如果这不是你的操作，请忽略此邮件。";
    }

    /**
     * 构建验证码
     */
    private String BuildVerificationCode() {
        int randomValue = SECURE_RANDOM.nextInt(1_000_000);
        return String.format("%06d", randomValue);
    }

    /**
     * 构建注册验证码缓存键
     */
    private String BuildRegisterCodeKey(String account) {
        return REGISTER_CODE_PREFIX + account;
    }

    /**
     * 构建发送冷却缓存键
     */
    private String BuildRegisterCodeCooldownKey(String account) {
        return REGISTER_CODE_COOLDOWN_PREFIX + account;
    }

    /**
     * 规范化账号
     */
    private String NormalizeAccount(String account) {
        return account == null ? "" : account.trim();
    }

    /**
     * 规范化邮箱
     */
    private String NormalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    /**
     * 解析页码
     */
    private Integer ResolvePageNo(Integer pageNo) {
        if (pageNo == null || pageNo < 1) {
            return PageQuery.DEFAULT_PAGE_NO;
        }
        return pageNo;
    }

    /**
     * 解析页大小
     */
    private Integer ResolvePageSize(Integer pageSize) {
        if (pageSize == null || pageSize < 1) {
            return PageQuery.DEFAULT_PAGE_SIZE;
        }
        if (pageSize > PageQuery.MAX_PAGE_SIZE) {
            return PageQuery.MAX_PAGE_SIZE;
        }
        return pageSize;
    }

    /**
     * 规范化关键字
     */
    private String NormalizeKeyword(String keyword) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        return normalizedKeyword.isBlank() ? null : normalizedKeyword;
    }

    /**
     * 解析用户状态筛选
     */
    private String ResolveUserStatus(String userStatus) {
        String normalizedStatus = userStatus == null ? "" : userStatus.trim().toUpperCase(Locale.ROOT);
        if (normalizedStatus.isBlank()) {
            return null;
        }
        try {
            return UserStatusEnum.valueOf(normalizedStatus).name();
        } catch (IllegalArgumentException exception) {
            throw new BusinessException(BizCodeEnum.PARAM_INVALID, "用户状态不合法");
        }
    }

    /**
     * 解析用户角色筛选
     */
    private String ResolveUserRole(String userRole) {
        String normalizedRole = userRole == null ? "" : userRole.trim().toUpperCase(Locale.ROOT);
        if (normalizedRole.isBlank()) {
            return null;
        }
        try {
            return UserRoleEnum.valueOf(normalizedRole).name();
        } catch (IllegalArgumentException exception) {
            throw new BusinessException(BizCodeEnum.PARAM_INVALID, "用户角色不合法");
        }
    }

    /**
     * 保存用户会话
     */
    private void SaveUserSession(String token, Long userId) {
        try {
            String sessionKey = USER_SESSION_PREFIX + token;
            stringRedisTemplate.opsForValue().set(sessionKey, userId.toString(), USER_SESSION_TTL);
        } catch (Exception exception) {
            // Redis不可用时不中断主链路
        }
    }

    /**
     * 删除用户会话
     */
    private void DeleteUserSession(String token) {
        if (token == null || token.isBlank()) {
            return;
        }
        try {
            stringRedisTemplate.delete(USER_SESSION_PREFIX + token);
        } catch (Exception exception) {
            LOGGER.warn("删除用户会话失败: token={}", token, exception);
        }
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
