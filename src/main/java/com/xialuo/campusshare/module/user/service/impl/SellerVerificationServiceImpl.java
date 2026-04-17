package com.xialuo.campusshare.module.user.service.impl;

import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.entity.SellerVerificationApplicationEntity;
import com.xialuo.campusshare.entity.UserEntity;
import com.xialuo.campusshare.enums.NotificationTypeEnum;
import com.xialuo.campusshare.enums.SellerVerificationStatusEnum;
import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.enums.UserStatusEnum;
import com.xialuo.campusshare.module.notification.service.NotificationService;
import com.xialuo.campusshare.module.user.dto.SellerVerificationApplicationResponseDto;
import com.xialuo.campusshare.module.user.dto.SellerVerificationApplyRequestDto;
import com.xialuo.campusshare.module.user.dto.SellerVerificationReviewRequestDto;
import com.xialuo.campusshare.module.user.mapper.SellerVerificationMapper;
import com.xialuo.campusshare.module.user.mapper.UserMapper;
import com.xialuo.campusshare.module.user.service.SellerVerificationService;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 卖家认证服务实现
 */
@Service
public class SellerVerificationServiceImpl implements SellerVerificationService {
    /** 用户Mapper */
    private final UserMapper userMapper;
    /** 卖家认证Mapper */
    private final SellerVerificationMapper sellerVerificationMapper;
    /** 通知服务 */
    private final NotificationService notificationService;

    public SellerVerificationServiceImpl(
        UserMapper userMapper,
        SellerVerificationMapper sellerVerificationMapper,
        NotificationService notificationService
    ) {
        this.userMapper = userMapper;
        this.sellerVerificationMapper = sellerVerificationMapper;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SellerVerificationApplicationResponseDto SubmitApplication(
        Long currentUserId,
        SellerVerificationApplyRequestDto requestDto
    ) {
        UserEntity userEntity = RequireActiveUser(currentUserId);
        if (userEntity.GetUserRole() == UserRoleEnum.VERIFIED_SELLER
            || userEntity.GetUserRole() == UserRoleEnum.ADMINISTRATOR) {
            throw new BusinessException(BizCodeEnum.SELLER_VERIFICATION_ALREADY_VERIFIED, "当前账号已具备卖家发布权限");
        }

        SellerVerificationApplicationEntity pendingApplication = sellerVerificationMapper.FindPendingApplicationByUserId(currentUserId);
        if (pendingApplication != null) {
            throw new BusinessException(BizCodeEnum.SELLER_VERIFICATION_PENDING_EXISTS, "已有待审核申请，请勿重复提交");
        }

        SellerVerificationApplicationEntity applicationEntity = new SellerVerificationApplicationEntity();
        applicationEntity.SetUserId(currentUserId);
        applicationEntity.SetRealName(NormalizeText(requestDto.GetRealName()));
        applicationEntity.SetContactPhone(NormalizeText(requestDto.GetContactPhone()));
        applicationEntity.SetQualificationDesc(NormalizeText(requestDto.GetQualificationDesc()));
        applicationEntity.SetCredentialFileIds(JoinFileIds(requestDto.GetCredentialFileIds()));
        applicationEntity.SetApplicationStatus(SellerVerificationStatusEnum.PENDING_REVIEW);
        applicationEntity.SetReviewRemark("");
        applicationEntity.SetReviewerUserId(null);
        applicationEntity.SetReviewTime(null);
        applicationEntity.SetCreateTime(LocalDateTime.now());
        applicationEntity.SetUpdateTime(LocalDateTime.now());
        applicationEntity.SetDeleted(Boolean.FALSE);

        sellerVerificationMapper.InsertApplication(applicationEntity);
        NotifyAdministratorPending(applicationEntity);
        return BuildApplicationResponse(applicationEntity);
    }

    @Override
    public SellerVerificationApplicationResponseDto GetMyLatestApplication(Long currentUserId) {
        RequireActiveUser(currentUserId);
        SellerVerificationApplicationEntity applicationEntity = sellerVerificationMapper.FindLatestApplicationByUserId(currentUserId);
        if (applicationEntity == null) {
            return null;
        }
        return BuildApplicationResponse(applicationEntity);
    }

    @Override
    public List<SellerVerificationApplicationResponseDto> ListPendingApplications() {
        return sellerVerificationMapper.ListPendingApplications().stream()
            .map(this::BuildApplicationResponse)
            .toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SellerVerificationApplicationResponseDto ReviewApplication(
        Long applicationId,
        SellerVerificationReviewRequestDto requestDto,
        Long adminUserId
    ) {
        SellerVerificationApplicationEntity applicationEntity = sellerVerificationMapper.FindApplicationById(applicationId);
        if (applicationEntity == null) {
            throw new BusinessException(BizCodeEnum.SELLER_VERIFICATION_NOT_FOUND, "卖家认证申请不存在");
        }
        if (applicationEntity.GetApplicationStatus() != SellerVerificationStatusEnum.PENDING_REVIEW) {
            throw new BusinessException(BizCodeEnum.SELLER_VERIFICATION_STATUS_INVALID, "当前申请状态不允许审核");
        }

        UserEntity applicantUser = userMapper.FindUserById(applicationEntity.GetUserId());
        if (applicantUser == null) {
            throw new BusinessException(BizCodeEnum.USER_NOT_FOUND, "申请用户不存在");
        }

        Boolean approved = Boolean.TRUE.equals(requestDto.GetApproved());
        if (approved) {
            applicantUser.SetUserRole(UserRoleEnum.VERIFIED_SELLER);
            applicantUser.SetUserStatus(UserStatusEnum.ACTIVE);
            applicantUser.SetUpdateTime(LocalDateTime.now());
            userMapper.UpdateUser(applicantUser);
            applicationEntity.SetApplicationStatus(SellerVerificationStatusEnum.APPROVED);
        } else {
            applicationEntity.SetApplicationStatus(SellerVerificationStatusEnum.REJECTED);
        }
        applicationEntity.SetReviewRemark(NormalizeText(requestDto.GetReviewRemark()));
        applicationEntity.SetReviewerUserId(adminUserId);
        applicationEntity.SetReviewTime(LocalDateTime.now());
        applicationEntity.SetUpdateTime(LocalDateTime.now());
        sellerVerificationMapper.UpdateApplication(applicationEntity);

        NotifyApplicantReviewResult(applicationEntity, approved);
        return BuildApplicationResponse(applicationEntity);
    }

    /**
     * 校验活跃用户
     */
    private UserEntity RequireActiveUser(Long userId) {
        UserEntity userEntity = userMapper.FindUserById(userId);
        if (userEntity == null) {
            throw new BusinessException(BizCodeEnum.USER_NOT_FOUND, "用户不存在");
        }
        if (userEntity.GetUserStatus() != UserStatusEnum.ACTIVE) {
            throw new BusinessException(BizCodeEnum.ACCOUNT_NOT_ACTIVE, "账号未审核通过");
        }
        return userEntity;
    }

    /**
     * 通知管理员有新申请
     */
    private void NotifyAdministratorPending(SellerVerificationApplicationEntity applicationEntity) {
        List<Long> adminUserIdList = userMapper.ListActiveAdministratorUserIds();
        if (adminUserIdList == null || adminUserIdList.isEmpty()) {
            return;
        }
        notificationService.BatchCreateNotification(
            adminUserIdList,
            NotificationTypeEnum.REVIEW,
            "卖家认证待审核",
            "有新的卖家认证申请待处理",
            "SELLER_VERIFICATION",
            applicationEntity.GetApplicationId()
        );
    }

    /**
     * 通知申请人审核结果
     */
    private void NotifyApplicantReviewResult(
        SellerVerificationApplicationEntity applicationEntity,
        Boolean approved
    ) {
        String title = approved ? "卖家认证审核通过" : "卖家认证审核未通过";
        String content = approved
            ? "你的卖家认证申请已通过，可发布商品"
            : "你的卖家认证申请未通过，请修改后重新提交";
        notificationService.CreateNotification(
            applicationEntity.GetUserId(),
            NotificationTypeEnum.REVIEW,
            title,
            content,
            "SELLER_VERIFICATION",
            applicationEntity.GetApplicationId()
        );
    }

    /**
     * 构建响应
     */
    private SellerVerificationApplicationResponseDto BuildApplicationResponse(
        SellerVerificationApplicationEntity applicationEntity
    ) {
        SellerVerificationApplicationResponseDto responseDto = new SellerVerificationApplicationResponseDto();
        responseDto.SetApplicationId(applicationEntity.GetApplicationId());
        responseDto.SetUserId(applicationEntity.GetUserId());
        responseDto.SetRealName(applicationEntity.GetRealName());
        responseDto.SetContactPhone(applicationEntity.GetContactPhone());
        responseDto.SetQualificationDesc(applicationEntity.GetQualificationDesc());
        responseDto.SetCredentialFileIds(SplitFileIds(applicationEntity.GetCredentialFileIds()));
        responseDto.SetApplicationStatus(applicationEntity.GetApplicationStatus());
        responseDto.SetReviewRemark(applicationEntity.GetReviewRemark());
        responseDto.SetReviewerUserId(applicationEntity.GetReviewerUserId());
        responseDto.SetReviewTime(applicationEntity.GetReviewTime());
        responseDto.SetCreateTime(applicationEntity.GetCreateTime());
        responseDto.SetUpdateTime(applicationEntity.GetUpdateTime());
        return responseDto;
    }

    /**
     * 规范化文本
     */
    private String NormalizeText(String text) {
        return text == null ? "" : text.trim();
    }

    /**
     * 拼接文件ID
     */
    private String JoinFileIds(List<String> fileIdList) {
        if (fileIdList == null || fileIdList.isEmpty()) {
            return "";
        }
        return fileIdList.stream()
            .map(this::NormalizeText)
            .filter(fileId -> !fileId.isBlank())
            .distinct()
            .reduce((left, right) -> left + "," + right)
            .orElse("");
    }

    /**
     * 拆分文件ID
     */
    private List<String> SplitFileIds(String fileIds) {
        if (fileIds == null || fileIds.isBlank()) {
            return List.of();
        }
        return Arrays.stream(fileIds.split(","))
            .map(this::NormalizeText)
            .filter(fileId -> !fileId.isBlank())
            .distinct()
            .toList();
    }
}

