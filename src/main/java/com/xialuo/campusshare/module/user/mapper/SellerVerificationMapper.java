package com.xialuo.campusshare.module.user.mapper;

import com.xialuo.campusshare.entity.SellerVerificationApplicationEntity;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 卖家认证申请数据映射接口
 */
@Mapper
public interface SellerVerificationMapper {
    /**
     * 新增申请
     */
    Integer InsertApplication(SellerVerificationApplicationEntity entity);

    /**
     * 更新申请
     */
    Integer UpdateApplication(SellerVerificationApplicationEntity entity);

    /**
     * 按ID查询申请
     */
    SellerVerificationApplicationEntity FindApplicationById(@Param("applicationId") Long applicationId);

    /**
     * 查询用户最新申请
     */
    SellerVerificationApplicationEntity FindLatestApplicationByUserId(@Param("userId") Long userId);

    /**
     * 查询用户待审核申请
     */
    SellerVerificationApplicationEntity FindPendingApplicationByUserId(@Param("userId") Long userId);

    /**
     * 查询待审核申请列表
     */
    List<SellerVerificationApplicationEntity> ListPendingApplications();
}

