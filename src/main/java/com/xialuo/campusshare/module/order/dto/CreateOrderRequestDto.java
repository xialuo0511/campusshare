package com.xialuo.campusshare.module.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 创建订单请求
 */
public class CreateOrderRequestDto {
    /** 商品ID */
    @NotNull(message = "商品ID不能为空")
    private Long productId;

    /** 交易地点 */
    @NotBlank(message = "交易地点不能为空")
    @Size(min = 1, max = 100, message = "交易地点长度需在1到100")
    private String tradeLocation;

    /**
     * 获取商品ID
     */
    public Long GetProductId() {
        return productId;
    }

    /**
     * 设置商品ID
     */
    public void SetProductId(Long productId) {
        this.productId = productId;
    }

    /**
     * 获取交易地点
     */
    public String GetTradeLocation() {
        return tradeLocation;
    }

    /**
     * 设置交易地点
     */
    public void SetTradeLocation(String tradeLocation) {
        this.tradeLocation = tradeLocation;
    }
}
