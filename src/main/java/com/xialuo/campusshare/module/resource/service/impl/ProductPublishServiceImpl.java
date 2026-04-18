package com.xialuo.campusshare.module.resource.service.impl;

import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.common.service.ContentModerationService;
import com.xialuo.campusshare.entity.ProductEntity;
import com.xialuo.campusshare.entity.UserEntity;
import com.xialuo.campusshare.enums.NotificationTypeEnum;
import com.xialuo.campusshare.enums.ProductStatusEnum;
import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.enums.UserStatusEnum;
import com.xialuo.campusshare.module.admin.constant.SystemRuleKeyConstants;
import com.xialuo.campusshare.module.admin.service.SystemRuleConfigService;
import com.xialuo.campusshare.module.notification.service.NotificationService;
import com.xialuo.campusshare.module.order.mapper.OrderMapper;
import com.xialuo.campusshare.module.resource.dto.ProductDetailResponseDto;
import com.xialuo.campusshare.module.resource.dto.ProductReviewRequestDto;
import com.xialuo.campusshare.module.resource.dto.PublishProductRequestDto;
import com.xialuo.campusshare.module.resource.mapper.ProductMapper;
import com.xialuo.campusshare.module.resource.service.ProductPublishService;
import com.xialuo.campusshare.module.user.mapper.UserMapper;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 商品发布服务实现
 */
@Service
public class ProductPublishServiceImpl implements ProductPublishService {
    /** 商品业务类型 */
    private static final String PRODUCT_BIZ_TYPE = "PRODUCT";
    /** 默认商品审核开关 */
    private static final Boolean DEFAULT_PRODUCT_REVIEW_REQUIRED = Boolean.TRUE;

    /** 商品Mapper */
    private final ProductMapper productMapper;
    /** 订单Mapper */
    private final OrderMapper orderMapper;
    /** 用户Mapper */
    private final UserMapper userMapper;
    /** 内容治理服务 */
    private final ContentModerationService contentModerationService;
    /** 规则配置服务 */
    private final SystemRuleConfigService systemRuleConfigService;
    /** 通知服务 */
    private final NotificationService notificationService;

    public ProductPublishServiceImpl(
        ProductMapper productMapper,
        OrderMapper orderMapper,
        UserMapper userMapper,
        ContentModerationService contentModerationService,
        SystemRuleConfigService systemRuleConfigService,
        NotificationService notificationService
    ) {
        this.productMapper = productMapper;
        this.orderMapper = orderMapper;
        this.userMapper = userMapper;
        this.contentModerationService = contentModerationService;
        this.systemRuleConfigService = systemRuleConfigService;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ProductDetailResponseDto PublishProduct(PublishProductRequestDto requestDto, Long currentUserId) {
        ValidatePublishPermission(currentUserId);
        ValidateSensitiveContent(requestDto);
        ProductEntity productEntity = BuildProductEntity(requestDto, currentUserId);
        Integer countRows = productMapper.InsertProduct(productEntity);
        if (countRows == null || countRows <= 0 || productEntity.GetProductId() == null) {
            throw new BusinessException(BizCodeEnum.SYSTEM_ERROR, "商品发布失败");
        }

        ProductEntity latestProductEntity = productMapper.FindProductById(productEntity.GetProductId());
        if (latestProductEntity == null) {
            throw new BusinessException(BizCodeEnum.PRODUCT_NOT_FOUND, "商品不存在");
        }
        return BuildProductDetailResponse(latestProductEntity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ProductDetailResponseDto UpdateProduct(
        Long productId,
        PublishProductRequestDto requestDto,
        Long currentUserId,
        UserRoleEnum currentUserRole
    ) {
        ProductEntity productEntity = productMapper.FindProductById(productId);
        if (productEntity == null) {
            throw new BusinessException(BizCodeEnum.PRODUCT_NOT_FOUND, "商品不存在");
        }
        ValidateManagePermission(productEntity, currentUserId, currentUserRole);
        ValidateSensitiveContent(requestDto);
        if (Boolean.TRUE.equals(productEntity.GetHasEffectiveOrder())) {
            throw new BusinessException(BizCodeEnum.PRODUCT_UNAVAILABLE, "商品存在进行中订单，不可编辑");
        }

        productEntity.SetTitle(NormalizeText(requestDto.GetTitle()));
        productEntity.SetCategory(NormalizeText(requestDto.GetCategory()));
        productEntity.SetConditionLevel(NormalizeText(requestDto.GetConditionLevel()));
        productEntity.SetPrice(requestDto.GetPrice());
        productEntity.SetTradeLocation(NormalizeText(requestDto.GetTradeLocation()));
        productEntity.SetDescription(NormalizeText(requestDto.GetDescription()));
        productEntity.SetImageFileIds(JoinImageFileIds(requestDto.GetImageFileIds()));
        if (productEntity.GetProductStatus() == ProductStatusEnum.REJECTED) {
            ProductStatusEnum initialStatus = BuildInitialProductStatus();
            productEntity.SetProductStatus(initialStatus);
            productEntity.SetOnShelf(initialStatus == ProductStatusEnum.PUBLISHED);
        }
        productEntity.SetUpdateTime(LocalDateTime.now());

        Integer updatedRows = productMapper.UpdateProduct(productEntity);
        if (updatedRows == null || updatedRows <= 0) {
            throw new BusinessException(BizCodeEnum.SYSTEM_ERROR, "商品编辑失败");
        }

        ProductEntity latestProductEntity = productMapper.FindProductById(productId);
        if (latestProductEntity == null) {
            throw new BusinessException(BizCodeEnum.PRODUCT_NOT_FOUND, "商品不存在");
        }
        return BuildProductDetailResponse(latestProductEntity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ProductDetailResponseDto OfflineProduct(
        Long productId,
        Long currentUserId,
        UserRoleEnum currentUserRole,
        String offlineRemark
    ) {
        ProductEntity productEntity = productMapper.FindProductById(productId);
        if (productEntity == null) {
            throw new BusinessException(BizCodeEnum.PRODUCT_NOT_FOUND, "商品不存在");
        }
        ValidateManagePermission(productEntity, currentUserId, currentUserRole);
        if (Boolean.TRUE.equals(productEntity.GetHasEffectiveOrder())) {
            throw new BusinessException(BizCodeEnum.PRODUCT_UNAVAILABLE, "商品存在进行中订单，不可下架");
        }
        if (!Boolean.TRUE.equals(productEntity.GetOnShelf()) || productEntity.GetProductStatus() == ProductStatusEnum.OFFLINE) {
            throw new BusinessException(BizCodeEnum.PRODUCT_UNAVAILABLE, "商品已下架");
        }

        String normalizedOfflineRemark = NormalizeText(offlineRemark);
        if (!normalizedOfflineRemark.isBlank()) {
            // 预留下架备注字段
        }

        Integer updatedRows = productMapper.OfflineProduct(productId, LocalDateTime.now());
        if (updatedRows == null || updatedRows <= 0) {
            throw new BusinessException(BizCodeEnum.PRODUCT_UNAVAILABLE, "商品当前不可下架");
        }

        ProductEntity latestProductEntity = productMapper.FindProductById(productId);
        if (latestProductEntity == null) {
            throw new BusinessException(BizCodeEnum.PRODUCT_NOT_FOUND, "商品不存在");
        }
        return BuildProductDetailResponse(latestProductEntity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ProductDetailResponseDto ForceOfflineProductByAdmin(
        Long productId,
        Long adminUserId,
        String offlineRemark
    ) {
        ProductEntity productEntity = productMapper.FindProductById(productId);
        if (productEntity == null) {
            throw new BusinessException(BizCodeEnum.PRODUCT_NOT_FOUND, "商品不存在");
        }
        LocalDateTime now = LocalDateTime.now();
        orderMapper.CloseOngoingOrdersByProductId(
            productId,
            NormalizeText(offlineRemark).isBlank() ? "管理员强制下架关闭订单" : NormalizeText(offlineRemark),
            now,
            now
        );
        productMapper.ForceOfflineProduct(productId, now);

        ProductEntity latestProductEntity = productMapper.FindProductById(productId);
        if (latestProductEntity == null) {
            throw new BusinessException(BizCodeEnum.PRODUCT_NOT_FOUND, "商品不存在");
        }
        return BuildProductDetailResponse(latestProductEntity);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ProductDetailResponseDto ReviewProductByAdmin(
        Long productId,
        ProductReviewRequestDto requestDto,
        Long adminUserId
    ) {
        ProductEntity productEntity = productMapper.FindProductById(productId);
        if (productEntity == null) {
            throw new BusinessException(BizCodeEnum.PRODUCT_NOT_FOUND, "商品不存在");
        }
        if (productEntity.GetProductStatus() != ProductStatusEnum.PENDING_REVIEW) {
            throw new BusinessException(BizCodeEnum.BUSINESS_CONFLICT, "当前商品状态不允许审核");
        }

        boolean approved = requestDto != null && Boolean.TRUE.equals(requestDto.GetApproved());
        String reviewRemark = NormalizeText(requestDto == null ? "" : requestDto.GetReviewRemark());
        ProductStatusEnum targetStatus = approved ? ProductStatusEnum.PUBLISHED : ProductStatusEnum.REJECTED;
        boolean targetOnShelf = approved;
        Integer updatedRows = productMapper.UpdateProductReviewStatus(
            productId,
            targetStatus,
            targetOnShelf,
            LocalDateTime.now()
        );
        if (updatedRows == null || updatedRows <= 0) {
            throw new BusinessException(BizCodeEnum.SYSTEM_ERROR, "商品审核失败");
        }

        notificationService.CreateNotification(
            productEntity.GetSellerUserId(),
            NotificationTypeEnum.REVIEW,
            approved ? "商品审核通过" : "商品审核未通过",
            BuildProductReviewContent(approved, reviewRemark),
            PRODUCT_BIZ_TYPE,
            productId
        );

        ProductEntity latestProductEntity = productMapper.FindProductById(productId);
        if (latestProductEntity == null) {
            throw new BusinessException(BizCodeEnum.PRODUCT_NOT_FOUND, "商品不存在");
        }
        return BuildProductDetailResponse(latestProductEntity);
    }

    /**
     * 校验管理权限
     */
    private void ValidateManagePermission(
        ProductEntity productEntity,
        Long currentUserId,
        UserRoleEnum currentUserRole
    ) {
        if (currentUserRole == UserRoleEnum.ADMINISTRATOR) {
            return;
        }
        if (currentUserId != null && currentUserId.equals(productEntity.GetSellerUserId())) {
            return;
        }
        throw new BusinessException(BizCodeEnum.FORBIDDEN, "无权管理该商品");
    }

    /**
     * 校验发布权限
     */
    private void ValidatePublishPermission(Long currentUserId) {
        UserEntity userEntity = userMapper.FindUserById(currentUserId);
        if (userEntity == null) {
            throw new BusinessException(BizCodeEnum.USER_NOT_FOUND, "用户不存在");
        }
        if (userEntity.GetUserStatus() != UserStatusEnum.ACTIVE) {
            throw new BusinessException(BizCodeEnum.ACCOUNT_NOT_ACTIVE, "账号未审核通过");
        }
        if (userEntity.GetUserRole() != UserRoleEnum.VERIFIED_SELLER
            && userEntity.GetUserRole() != UserRoleEnum.ADMINISTRATOR) {
            throw new BusinessException(BizCodeEnum.SELLER_VERIFICATION_REQUIRED, "请先完成认证卖家审核后再发布商品");
        }
    }

    /**
     * 构建商品实体
     */
    private ProductEntity BuildProductEntity(PublishProductRequestDto requestDto, Long currentUserId) {
        ProductStatusEnum initialProductStatus = BuildInitialProductStatus();
        ProductEntity productEntity = new ProductEntity();
        productEntity.SetResourceId(null);
        productEntity.SetTitle(NormalizeText(requestDto.GetTitle()));
        productEntity.SetCategory(NormalizeText(requestDto.GetCategory()));
        productEntity.SetConditionLevel(NormalizeText(requestDto.GetConditionLevel()));
        productEntity.SetPrice(requestDto.GetPrice());
        productEntity.SetTradeLocation(NormalizeText(requestDto.GetTradeLocation()));
        productEntity.SetDescription(NormalizeText(requestDto.GetDescription()));
        productEntity.SetImageFileIds(JoinImageFileIds(requestDto.GetImageFileIds()));
        productEntity.SetSellerUserId(currentUserId);
        productEntity.SetProductStatus(initialProductStatus);
        productEntity.SetOnShelf(initialProductStatus == ProductStatusEnum.PUBLISHED);
        productEntity.SetStockCount(1);
        productEntity.SetHasEffectiveOrder(Boolean.FALSE);
        productEntity.SetCreateTime(LocalDateTime.now());
        productEntity.SetUpdateTime(LocalDateTime.now());
        productEntity.SetDeleted(Boolean.FALSE);
        return productEntity;
    }

    /**
     * 构建商品审核通知内容
     */
    private String BuildProductReviewContent(boolean approved, String reviewRemark) {
        if (approved) {
            return "商品审核通过，已上架展示";
        }
        if (reviewRemark.isBlank()) {
            return "商品审核未通过，请修改后重新提交";
        }
        return "商品审核未通过：" + reviewRemark;
    }

    /**
     * 构建详情响应
     */
    private ProductDetailResponseDto BuildProductDetailResponse(ProductEntity productEntity) {
        ProductDetailResponseDto responseDto = new ProductDetailResponseDto();
        responseDto.SetProductId(productEntity.GetProductId());
        responseDto.SetTitle(ResolveTitle(productEntity));
        responseDto.SetCategory(productEntity.GetCategory());
        responseDto.SetConditionLevel(productEntity.GetConditionLevel());
        responseDto.SetPrice(productEntity.GetPrice());
        responseDto.SetTradeLocation(productEntity.GetTradeLocation());
        responseDto.SetSellerUserId(productEntity.GetSellerUserId());
        responseDto.SetSellerDisplayName(ResolveSellerDisplayName(productEntity.GetSellerUserId()));
        responseDto.SetProductStatus(productEntity.GetProductStatus());
        responseDto.SetDescription(ResolveDescription(productEntity));
        responseDto.SetImageFileIds(SplitImageFileIds(productEntity.GetImageFileIds()));
        responseDto.SetOnShelf(productEntity.GetOnShelf());
        responseDto.SetStockCount(productEntity.GetStockCount());
        responseDto.SetCreateTime(productEntity.GetCreateTime());
        return responseDto;
    }

    /**
     * 解析标题
     */
    private String ResolveTitle(ProductEntity productEntity) {
        String title = NormalizeText(productEntity.GetTitle());
        if (!title.isBlank()) {
            return title;
        }
        String category = NormalizeText(productEntity.GetCategory());
        if (!category.isBlank()) {
            return category + " #" + productEntity.GetProductId();
        }
        return "校园商品 #" + productEntity.GetProductId();
    }

    /**
     * 解析描述
     */
    private String ResolveDescription(ProductEntity productEntity) {
        String description = NormalizeText(productEntity.GetDescription());
        if (!description.isBlank()) {
            return description;
        }
        return "分类：" + NullToDash(productEntity.GetCategory())
            + "，成色：" + NullToDash(productEntity.GetConditionLevel())
            + "，交易地点：" + NullToDash(productEntity.GetTradeLocation())
            + "。";
    }

    /**
     * 获取卖家显示名
     */
    private String ResolveSellerDisplayName(Long sellerUserId) {
        if (sellerUserId == null) {
            return "匿名用户";
        }
        UserEntity sellerEntity = userMapper.FindUserById(sellerUserId);
        if (sellerEntity == null || sellerEntity.GetDisplayName() == null || sellerEntity.GetDisplayName().isBlank()) {
            return "用户#" + sellerUserId;
        }
        return sellerEntity.GetDisplayName().trim();
    }

    /**
     * 拼接图片ID
     */
    private String JoinImageFileIds(List<String> imageFileIdList) {
        if (imageFileIdList == null || imageFileIdList.isEmpty()) {
            return "";
        }
        return imageFileIdList.stream()
            .map(this::NormalizeText)
            .filter(imageFileId -> !imageFileId.isBlank())
            .distinct()
            .reduce((left, right) -> left + "," + right)
            .orElse("");
    }

    /**
     * 拆分图片ID
     */
    private List<String> SplitImageFileIds(String imageFileIds) {
        if (imageFileIds == null || imageFileIds.isBlank()) {
            return List.of();
        }
        return Arrays.stream(imageFileIds.split(","))
            .map(this::NormalizeText)
            .filter(imageFileId -> !imageFileId.isBlank())
            .distinct()
            .toList();
    }

    /**
     * 校验敏感词
     */
    private void ValidateSensitiveContent(PublishProductRequestDto requestDto) {
        if (requestDto == null) {
            return;
        }
        contentModerationService.ValidateNoSensitiveWords(
            List.of(
                requestDto.GetTitle(),
                requestDto.GetCategory(),
                requestDto.GetConditionLevel(),
                requestDto.GetTradeLocation(),
                requestDto.GetDescription()
            ),
            "商品内容"
        );
    }

    /**
     * 构建商品初始状态
     */
    private ProductStatusEnum BuildInitialProductStatus() {
        return Boolean.TRUE.equals(ResolveProductReviewRequired())
            ? ProductStatusEnum.PENDING_REVIEW
            : ProductStatusEnum.PUBLISHED;
    }

    /**
     * 读取商品审核开关
     */
    private Boolean ResolveProductReviewRequired() {
        return systemRuleConfigService.GetRuleBooleanValueOrDefault(
            SystemRuleKeyConstants.PRODUCT_REVIEW_REQUIRED,
            DEFAULT_PRODUCT_REVIEW_REQUIRED
        );
    }

    /**
     * 文本规范化
     */
    private String NormalizeText(String text) {
        return text == null ? "" : text.trim();
    }

    /**
     * 空值转横线
     */
    private String NullToDash(String text) {
        String normalizedText = NormalizeText(text);
        if (normalizedText.isBlank()) {
            return "-";
        }
        return normalizedText;
    }
}
