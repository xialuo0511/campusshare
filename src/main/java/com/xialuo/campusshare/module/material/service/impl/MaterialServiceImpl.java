package com.xialuo.campusshare.module.material.service.impl;

import com.xialuo.campusshare.common.api.PageQuery;
import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.common.service.ContentModerationService;
import com.xialuo.campusshare.entity.StudyMaterialEntity;
import com.xialuo.campusshare.entity.UserEntity;
import com.xialuo.campusshare.enums.NotificationTypeEnum;
import com.xialuo.campusshare.enums.ResourceStatusEnum;
import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.module.admin.constant.SystemRuleKeyConstants;
import com.xialuo.campusshare.module.admin.service.SystemRuleConfigService;
import com.xialuo.campusshare.module.material.dto.MaterialDownloadResponseDto;
import com.xialuo.campusshare.module.material.dto.MaterialListResponseDto;
import com.xialuo.campusshare.module.material.dto.MaterialReviewRequestDto;
import com.xialuo.campusshare.module.material.dto.MaterialResponseDto;
import com.xialuo.campusshare.module.material.dto.UploadMaterialRequestDto;
import com.xialuo.campusshare.module.material.mapper.StudyMaterialMapper;
import com.xialuo.campusshare.module.material.service.MaterialService;
import com.xialuo.campusshare.module.notification.service.NotificationService;
import com.xialuo.campusshare.module.point.service.PointLedgerService;
import com.xialuo.campusshare.module.user.mapper.UserMapper;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 资料服务实现
 */
@Service
public class MaterialServiceImpl implements MaterialService {
    /** 资料业务类型 */
    private static final String MATERIAL_BIZ_TYPE = "MATERIAL";
    /** 文件访问地址模板 */
    private static final String MATERIAL_FILE_ACCESS_URL_PATTERN = "/api/v1/materials/%d/files/%s";

    /** 默认资料审核开关 */
    private static final Boolean DEFAULT_MATERIAL_REVIEW_REQUIRED = Boolean.TRUE;
    /** 默认上传奖励积分 */
    private static final Integer DEFAULT_MATERIAL_UPLOAD_REWARD_POINTS = 2;
    /** 默认下载扣减积分 */
    private static final Integer DEFAULT_MATERIAL_DOWNLOAD_COST_POINTS = 1;

    /** 资料Mapper */
    private final StudyMaterialMapper studyMaterialMapper;
    /** 用户Mapper */
    private final UserMapper userMapper;
    /** 通知服务 */
    private final NotificationService notificationService;
    /** 积分流水服务 */
    private final PointLedgerService pointLedgerService;
    /** 规则配置服务 */
    private final SystemRuleConfigService systemRuleConfigService;
    /** 内容治理服务 */
    private final ContentModerationService contentModerationService;

    public MaterialServiceImpl(
        StudyMaterialMapper studyMaterialMapper,
        UserMapper userMapper,
        NotificationService notificationService,
        PointLedgerService pointLedgerService,
        SystemRuleConfigService systemRuleConfigService,
        ContentModerationService contentModerationService
    ) {
        this.studyMaterialMapper = studyMaterialMapper;
        this.userMapper = userMapper;
        this.notificationService = notificationService;
        this.pointLedgerService = pointLedgerService;
        this.systemRuleConfigService = systemRuleConfigService;
        this.contentModerationService = contentModerationService;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MaterialResponseDto UploadMaterial(UploadMaterialRequestDto requestDto, Long currentUserId) {
        ValidateSensitiveContent(requestDto);

        StudyMaterialEntity materialEntity = new StudyMaterialEntity();
        materialEntity.SetUploaderUserId(currentUserId);
        materialEntity.SetCourseName(requestDto.GetCourseName());
        materialEntity.SetTags(JoinTags(requestDto.GetTags()));
        materialEntity.SetDescription(requestDto.GetDescription());
        materialEntity.SetFileId(requestDto.GetFileId());
        materialEntity.SetFileType(requestDto.GetFileType());
        materialEntity.SetFileSizeBytes(requestDto.GetFileSizeBytes());
        materialEntity.SetMaterialStatus(BuildInitialMaterialStatus());
        materialEntity.SetDownloadCostPoints(ResolveMaterialDownloadCostPoints());
        materialEntity.SetCopyrightDeclared(requestDto.GetCopyrightDeclared());
        materialEntity.SetDownloadCount(0);
        materialEntity.SetCreateTime(LocalDateTime.now());
        materialEntity.SetUpdateTime(LocalDateTime.now());
        materialEntity.SetDeleted(Boolean.FALSE);
        studyMaterialMapper.InsertMaterial(materialEntity);

        SendUploadNotifications(materialEntity, currentUserId);
        return BuildMaterialResponse(materialEntity);
    }

    @Override
    public MaterialResponseDto GetMaterialDetail(Long materialId, Long currentUserId, UserRoleEnum currentUserRole) {
        StudyMaterialEntity materialEntity = GetMaterialById(materialId);
        ValidateMaterialReadable(materialEntity, currentUserId, currentUserRole);
        return BuildMaterialResponse(materialEntity);
    }

    @Override
    public MaterialListResponseDto ListMyMaterials(
        Long currentUserId,
        Integer pageNo,
        Integer pageSize,
        String materialStatus
    ) {
        Integer resolvedPageNo = ResolvePageNo(pageNo);
        Integer resolvedPageSize = ResolvePageSize(pageSize);
        String resolvedMaterialStatus = ResolveMaterialStatusFilter(materialStatus);
        Integer offset = (resolvedPageNo - 1) * resolvedPageSize;

        List<MaterialResponseDto> materialResponseList = studyMaterialMapper.ListMaterialsByUploaderPaged(
            currentUserId,
            resolvedMaterialStatus,
            offset,
            resolvedPageSize
        ).stream().map(this::BuildMaterialResponse).toList();

        Long totalCount = studyMaterialMapper.CountMaterialsByUploader(currentUserId, resolvedMaterialStatus);
        return BuildMaterialListResponse(resolvedPageNo, resolvedPageSize, totalCount, materialResponseList);
    }

    @Override
    public MaterialListResponseDto ListPublishedMaterials(
        Integer pageNo,
        Integer pageSize,
        String keyword,
        String tagKeyword
    ) {
        Integer resolvedPageNo = ResolvePageNo(pageNo);
        Integer resolvedPageSize = ResolvePageSize(pageSize);
        Integer offset = (resolvedPageNo - 1) * resolvedPageSize;
        String resolvedKeyword = NormalizeText(keyword);
        String resolvedTagKeyword = NormalizeText(tagKeyword);

        List<MaterialResponseDto> materialResponseList = studyMaterialMapper.ListPublishedMaterialsPaged(
            resolvedKeyword,
            resolvedTagKeyword,
            offset,
            resolvedPageSize
        ).stream().map(this::BuildMaterialResponse).toList();
        Long totalCount = studyMaterialMapper.CountPublishedMaterialsByFilter(
            resolvedKeyword,
            resolvedTagKeyword
        );
        return BuildMaterialListResponse(resolvedPageNo, resolvedPageSize, totalCount, materialResponseList);
    }

    @Override
    public MaterialListResponseDto ListPendingReviewMaterials(Integer pageNo, Integer pageSize) {
        Integer resolvedPageNo = ResolvePageNo(pageNo);
        Integer resolvedPageSize = ResolvePageSize(pageSize);
        Integer offset = (resolvedPageNo - 1) * resolvedPageSize;

        List<MaterialResponseDto> materialResponseList = studyMaterialMapper.ListPendingReviewMaterialsPaged(
            offset,
            resolvedPageSize
        ).stream().map(this::BuildMaterialResponse).toList();
        Long totalCount = studyMaterialMapper.CountPendingReviewMaterials();
        return BuildMaterialListResponse(resolvedPageNo, resolvedPageSize, totalCount, materialResponseList);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MaterialResponseDto ReviewMaterial(
        Long materialId,
        MaterialReviewRequestDto requestDto,
        Long adminUserId
    ) {
        StudyMaterialEntity materialEntity = GetMaterialById(materialId);
        if (materialEntity.GetMaterialStatus() != ResourceStatusEnum.PENDING_REVIEW) {
            throw new BusinessException(BizCodeEnum.MATERIAL_STATUS_INVALID, "当前资料状态不允许审核");
        }

        Boolean approved = Boolean.TRUE.equals(requestDto.GetApproved());
        String reviewRemark = NormalizeText(requestDto.GetReviewRemark());
        materialEntity.SetMaterialStatus(approved ? ResourceStatusEnum.PUBLISHED : ResourceStatusEnum.REJECTED);
        materialEntity.SetReviewRemark(reviewRemark);
        materialEntity.SetLastReviewTime(LocalDateTime.now());
        materialEntity.SetUpdateTime(LocalDateTime.now());
        studyMaterialMapper.UpdateMaterial(materialEntity);

        if (approved) {
            Integer uploadRewardPoints = ResolveMaterialUploadRewardPoints();
            if (uploadRewardPoints > 0) {
                pointLedgerService.RecordUploadReward(
                    materialEntity.GetUploaderUserId(),
                    uploadRewardPoints,
                    MATERIAL_BIZ_TYPE,
                    materialEntity.GetMaterialId(),
                    "资料审核通过奖励"
                );
            }
            notificationService.CreateNotification(
                materialEntity.GetUploaderUserId(),
                NotificationTypeEnum.POINT,
                "资料审核通过并奖励积分",
                uploadRewardPoints > 0
                    ? ("资料已发布，已发放上传奖励积分：" + uploadRewardPoints)
                    : "资料已发布，当前规则未发放上传奖励积分",
                MATERIAL_BIZ_TYPE,
                materialEntity.GetMaterialId()
            );
        } else {
            notificationService.CreateNotification(
                materialEntity.GetUploaderUserId(),
                NotificationTypeEnum.REVIEW,
                "资料审核未通过",
                reviewRemark.isBlank() ? "资料未通过审核，请修改后重新提交" : ("资料未通过审核：" + reviewRemark),
                MATERIAL_BIZ_TYPE,
                materialEntity.GetMaterialId()
            );
        }
        return BuildMaterialResponse(materialEntity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MaterialResponseDto OfflineMaterial(
        Long materialId,
        Long currentUserId,
        UserRoleEnum currentUserRole,
        String offlineRemark
    ) {
        StudyMaterialEntity materialEntity = GetMaterialById(materialId);
        ValidateMaterialOperable(materialEntity, currentUserId, currentUserRole);
        if (materialEntity.GetMaterialStatus() == ResourceStatusEnum.OFFLINE) {
            throw new BusinessException(BizCodeEnum.MATERIAL_STATUS_INVALID, "资料已下架");
        }

        materialEntity.SetMaterialStatus(ResourceStatusEnum.OFFLINE);
        materialEntity.SetReviewRemark(offlineRemark);
        materialEntity.SetLastReviewTime(LocalDateTime.now());
        materialEntity.SetUpdateTime(LocalDateTime.now());
        studyMaterialMapper.UpdateMaterial(materialEntity);

        if (!currentUserId.equals(materialEntity.GetUploaderUserId())) {
            notificationService.CreateNotification(
                materialEntity.GetUploaderUserId(),
                NotificationTypeEnum.REVIEW,
                "资料已下架",
                "管理员已下架你的资料，请查看处理说明",
                MATERIAL_BIZ_TYPE,
                materialEntity.GetMaterialId()
            );
        }
        return BuildMaterialResponse(materialEntity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public MaterialDownloadResponseDto DownloadMaterial(Long materialId, Long currentUserId) {
        StudyMaterialEntity materialEntity = GetMaterialById(materialId);
        if (materialEntity.GetMaterialStatus() != ResourceStatusEnum.PUBLISHED) {
            throw new BusinessException(BizCodeEnum.MATERIAL_STATUS_INVALID, "资料当前不可下载");
        }

        Integer deductedPoints = 0;
        if (!currentUserId.equals(materialEntity.GetUploaderUserId())) {
            deductedPoints = ResolveDownloadCostPoints(materialEntity);
            if (deductedPoints > 0) {
                pointLedgerService.RecordDownloadCost(
                    currentUserId,
                    deductedPoints,
                    MATERIAL_BIZ_TYPE,
                    materialEntity.GetMaterialId(),
                    "资料下载扣减"
                );
            }
        }

        Integer countRows = studyMaterialMapper.IncreaseDownloadCount(materialId, LocalDateTime.now());
        if (countRows == null || countRows <= 0) {
            throw new BusinessException(BizCodeEnum.MATERIAL_STATUS_INVALID, "资料当前不可下载");
        }

        StudyMaterialEntity latestMaterialEntity = GetMaterialById(materialId);
        UserEntity currentUserEntity = userMapper.FindUserById(currentUserId);
        if (currentUserEntity == null) {
            throw new BusinessException(BizCodeEnum.USER_NOT_FOUND, "用户不存在");
        }

        SendDownloadNotifications(latestMaterialEntity, currentUserId, deductedPoints);
        return BuildDownloadResponse(latestMaterialEntity, currentUserEntity.GetPointBalance(), deductedPoints);
    }

    /**
     * 校验敏感词
     */
    private void ValidateSensitiveContent(UploadMaterialRequestDto requestDto) {
        if (requestDto == null) {
            return;
        }
        contentModerationService.ValidateNoSensitiveWords(
            List.of(
                requestDto.GetCourseName(),
                requestDto.GetDescription(),
                requestDto.GetFileType()
            ),
            "资料内容"
        );
    }

    /**
     * 按ID查询资料
     */
    private StudyMaterialEntity GetMaterialById(Long materialId) {
        StudyMaterialEntity materialEntity = studyMaterialMapper.FindMaterialById(materialId);
        if (materialEntity == null) {
            throw new BusinessException(BizCodeEnum.MATERIAL_NOT_FOUND, "资料不存在");
        }
        return materialEntity;
    }

    /**
     * 构建初始资料状态
     */
    private ResourceStatusEnum BuildInitialMaterialStatus() {
        return Boolean.TRUE.equals(ResolveMaterialReviewRequired())
            ? ResourceStatusEnum.PENDING_REVIEW
            : ResourceStatusEnum.PUBLISHED;
    }

    /**
     * 读取资料审核开关
     */
    private Boolean ResolveMaterialReviewRequired() {
        return systemRuleConfigService.GetRuleBooleanValueOrDefault(
            SystemRuleKeyConstants.MATERIAL_REVIEW_REQUIRED,
            DEFAULT_MATERIAL_REVIEW_REQUIRED
        );
    }

    /**
     * 读取上传奖励积分
     */
    private Integer ResolveMaterialUploadRewardPoints() {
        Integer rewardPoints = systemRuleConfigService.GetRuleIntegerValueOrDefault(
            SystemRuleKeyConstants.MATERIAL_UPLOAD_REWARD_POINTS,
            DEFAULT_MATERIAL_UPLOAD_REWARD_POINTS
        );
        if (rewardPoints == null || rewardPoints < 0) {
            return DEFAULT_MATERIAL_UPLOAD_REWARD_POINTS;
        }
        return rewardPoints;
    }

    /**
     * 读取下载扣减积分
     */
    private Integer ResolveMaterialDownloadCostPoints() {
        Integer costPoints = systemRuleConfigService.GetRuleIntegerValueOrDefault(
            SystemRuleKeyConstants.MATERIAL_DOWNLOAD_COST_POINTS,
            DEFAULT_MATERIAL_DOWNLOAD_COST_POINTS
        );
        if (costPoints == null || costPoints < 0) {
            return DEFAULT_MATERIAL_DOWNLOAD_COST_POINTS;
        }
        return costPoints;
    }

    /**
     * 获取下载积分
     */
    private Integer ResolveDownloadCostPoints(StudyMaterialEntity materialEntity) {
        if (materialEntity.GetDownloadCostPoints() == null || materialEntity.GetDownloadCostPoints() < 0) {
            return 0;
        }
        return materialEntity.GetDownloadCostPoints();
    }

    /**
     * 发送上传通知
     */
    private void SendUploadNotifications(StudyMaterialEntity materialEntity, Long currentUserId) {
        if (materialEntity.GetMaterialStatus() == ResourceStatusEnum.PUBLISHED) {
            Integer uploadRewardPoints = ResolveMaterialUploadRewardPoints();
            if (uploadRewardPoints > 0) {
                pointLedgerService.RecordUploadReward(
                    currentUserId,
                    uploadRewardPoints,
                    MATERIAL_BIZ_TYPE,
                    materialEntity.GetMaterialId(),
                    "资料上传奖励"
                );
            }
            notificationService.CreateNotification(
                currentUserId,
                NotificationTypeEnum.POINT,
                "资料上传奖励到账",
                uploadRewardPoints > 0
                    ? ("资料已发布，已发放上传积分奖励：" + uploadRewardPoints)
                    : "资料已发布，当前规则未发放上传积分奖励",
                MATERIAL_BIZ_TYPE,
                materialEntity.GetMaterialId()
            );
            return;
        }
        notificationService.CreateNotification(
            currentUserId,
            NotificationTypeEnum.REVIEW,
            "资料上传成功",
            "资料已提交，等待管理员审核",
            MATERIAL_BIZ_TYPE,
            materialEntity.GetMaterialId()
        );
    }

    /**
     * 发送下载通知
     */
    private void SendDownloadNotifications(
        StudyMaterialEntity materialEntity,
        Long currentUserId,
        Integer deductedPoints
    ) {
        notificationService.CreateNotification(
            currentUserId,
            NotificationTypeEnum.POINT,
            "资料下载成功",
            "本次下载扣减积分：" + deductedPoints,
            MATERIAL_BIZ_TYPE,
            materialEntity.GetMaterialId()
        );
        if (!currentUserId.equals(materialEntity.GetUploaderUserId())) {
            notificationService.CreateNotification(
                materialEntity.GetUploaderUserId(),
                NotificationTypeEnum.SYSTEM,
                "资料有新下载记录",
                "你的资料被用户下载，可在资料中心查看详情",
                MATERIAL_BIZ_TYPE,
                materialEntity.GetMaterialId()
            );
        }
    }

    /**
     * 校验资料可读权限
     */
    private void ValidateMaterialReadable(
        StudyMaterialEntity materialEntity,
        Long currentUserId,
        UserRoleEnum currentUserRole
    ) {
        if (materialEntity.GetMaterialStatus() == ResourceStatusEnum.PUBLISHED) {
            return;
        }
        if (currentUserRole == UserRoleEnum.ADMINISTRATOR) {
            return;
        }
        if (currentUserId.equals(materialEntity.GetUploaderUserId())) {
            return;
        }
        throw new BusinessException(BizCodeEnum.MATERIAL_PERMISSION_DENIED, "无权查看该资料");
    }

    /**
     * 校验资料可操作权限
     */
    private void ValidateMaterialOperable(
        StudyMaterialEntity materialEntity,
        Long currentUserId,
        UserRoleEnum currentUserRole
    ) {
        if (currentUserRole == UserRoleEnum.ADMINISTRATOR) {
            return;
        }
        if (currentUserId.equals(materialEntity.GetUploaderUserId())) {
            return;
        }
        throw new BusinessException(BizCodeEnum.MATERIAL_PERMISSION_DENIED, "无权操作该资料");
    }

    /**
     * 拼接标签
     */
    private String JoinTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return "";
        }
        return String.join(",", tags);
    }

    /**
     * 拆分标签
     */
    private List<String> SplitTags(String tagsText) {
        if (tagsText == null || tagsText.isBlank()) {
            return new ArrayList<>();
        }
        return Arrays.stream(tagsText.split(","))
            .map(String::trim)
            .filter(item -> !item.isBlank())
            .distinct()
            .toList();
    }

    /**
     * 构建资料响应
     */
    private MaterialResponseDto BuildMaterialResponse(StudyMaterialEntity materialEntity) {
        MaterialResponseDto responseDto = new MaterialResponseDto();
        responseDto.SetMaterialId(materialEntity.GetMaterialId());
        responseDto.SetUploaderUserId(materialEntity.GetUploaderUserId());
        responseDto.SetCourseName(materialEntity.GetCourseName());
        responseDto.SetTags(SplitTags(materialEntity.GetTags()));
        responseDto.SetDescription(materialEntity.GetDescription());
        responseDto.SetFileId(materialEntity.GetFileId());
        responseDto.SetFileType(materialEntity.GetFileType());
        responseDto.SetFileSizeBytes(materialEntity.GetFileSizeBytes());
        responseDto.SetMaterialStatus(materialEntity.GetMaterialStatus());
        responseDto.SetDownloadCostPoints(materialEntity.GetDownloadCostPoints());
        responseDto.SetCopyrightDeclared(materialEntity.GetCopyrightDeclared());
        responseDto.SetDownloadCount(materialEntity.GetDownloadCount());
        responseDto.SetReviewRemark(materialEntity.GetReviewRemark());
        responseDto.SetLastReviewTime(materialEntity.GetLastReviewTime());
        responseDto.SetCreateTime(materialEntity.GetCreateTime());
        return responseDto;
    }

    /**
     * 构建下载响应
     */
    private MaterialDownloadResponseDto BuildDownloadResponse(
        StudyMaterialEntity materialEntity,
        Integer currentPointBalance,
        Integer deductedPoints
    ) {
        MaterialDownloadResponseDto responseDto = new MaterialDownloadResponseDto();
        responseDto.SetMaterialId(materialEntity.GetMaterialId());
        responseDto.SetFileId(materialEntity.GetFileId());
        responseDto.SetFileAccessUrl(BuildFileAccessUrl(materialEntity.GetMaterialId(), materialEntity.GetFileId()));
        responseDto.SetDeductedPoints(deductedPoints);
        responseDto.SetCurrentPointBalance(currentPointBalance);
        responseDto.SetDownloadCount(materialEntity.GetDownloadCount());
        return responseDto;
    }

    /**
     * 构建文件访问地址
     */
    private String BuildFileAccessUrl(Long materialId, String fileId) {
        return String.format(MATERIAL_FILE_ACCESS_URL_PATTERN, materialId, fileId);
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
     * 解析资料状态筛选
     */
    private String ResolveMaterialStatusFilter(String materialStatus) {
        String normalizedStatus = materialStatus == null ? "" : materialStatus.trim().toUpperCase(Locale.ROOT);
        if (normalizedStatus.isBlank()) {
            return null;
        }
        try {
            return ResourceStatusEnum.valueOf(normalizedStatus).name();
        } catch (IllegalArgumentException exception) {
            throw new BusinessException(BizCodeEnum.PARAM_INVALID, "资料状态不合法");
        }
    }

    /**
     * 构建资料列表响应
     */
    private MaterialListResponseDto BuildMaterialListResponse(
        Integer pageNo,
        Integer pageSize,
        Long totalCount,
        List<MaterialResponseDto> materialList
    ) {
        MaterialListResponseDto responseDto = new MaterialListResponseDto();
        responseDto.SetPageNo(pageNo);
        responseDto.SetPageSize(pageSize);
        responseDto.SetTotalCount(totalCount == null ? 0L : totalCount);
        responseDto.SetMaterialList(materialList);
        return responseDto;
    }

    /**
     * 文本规范化
     */
    private String NormalizeText(String text) {
        return text == null ? "" : text.trim();
    }
}
