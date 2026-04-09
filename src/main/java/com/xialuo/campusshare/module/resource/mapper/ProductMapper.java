package com.xialuo.campusshare.module.resource.mapper;

import com.xialuo.campusshare.entity.ProductEntity;
import java.time.LocalDateTime;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 商品数据映射接口
 */
@Mapper
public interface ProductMapper {
    /**
     * 按ID查询商品
     */
    ProductEntity FindProductById(@Param("productId") Long productId);

    /**
     * 锁定商品
     */
    Integer LockProductForOrder(@Param("productId") Long productId, @Param("updateTime") LocalDateTime updateTime);

    /**
     * 释放商品锁定
     */
    Integer ReleaseProductOrderLock(@Param("productId") Long productId, @Param("updateTime") LocalDateTime updateTime);
}
