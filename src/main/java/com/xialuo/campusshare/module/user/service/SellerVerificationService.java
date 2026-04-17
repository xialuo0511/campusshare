package com.xialuo.campusshare.module.user.service;

import com.xialuo.campusshare.module.user.dto.SellerVerificationApplicationResponseDto;
import com.xialuo.campusshare.module.user.dto.SellerVerificationApplyRequestDto;
import com.xialuo.campusshare.module.user.dto.SellerVerificationReviewRequestDto;
import java.util.List;

/**
 * 卖家认证服务接口
 */
public interface SellerVerificationService {
    /**
     * 提交卖家认证申请
     */
    SellerVerificationApplicationResponseDto SubmitApplication(
        Long currentUserId,
        SellerVerificationApplyRequestDto requestDto
    );

    /**
     * 查询我的最新申请
     */
    SellerVerificationApplicationResponseDto GetMyLatestApplication(Long currentUserId);

    /**
     * 查询待审核申请
     */
    List<SellerVerificationApplicationResponseDto> ListPendingApplications();

    /**
     * 审核申请
     */
    SellerVerificationApplicationResponseDto ReviewApplication(
        Long applicationId,
        SellerVerificationReviewRequestDto requestDto,
        Long adminUserId
    );
}

