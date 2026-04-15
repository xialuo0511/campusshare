package com.xialuo.campusshare.module.resource.dto;

/**
 * 商品详情响应
 */
public class ProductDetailResponseDto extends ProductSummaryResponseDto {
    /** 描述 */
    private String description;
    /** 是否上架 */
    private Boolean onShelf;
    /** 库存 */
    private Integer stockCount;

    /**
     * 获取描述
     */
    public String GetDescription() {
        return description;
    }

    /**
     * 设置描述
     */
    public void SetDescription(String description) {
        this.description = description;
    }

    /**
     * 获取上架标记
     */
    public Boolean GetOnShelf() {
        return onShelf;
    }

    /**
     * 设置上架标记
     */
    public void SetOnShelf(Boolean onShelf) {
        this.onShelf = onShelf;
    }

    /**
     * 获取库存
     */
    public Integer GetStockCount() {
        return stockCount;
    }

    /**
     * 设置库存
     */
    public void SetStockCount(Integer stockCount) {
        this.stockCount = stockCount;
    }
}
