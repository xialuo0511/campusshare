package com.xialuo.campusshare.module.material.dto;

/**
 * 资料下载响应
 */
public class MaterialDownloadResponseDto {
    /** 资料ID */
    private Long materialId;
    /** 文件ID */
    private String fileId;
    /** 文件访问地址 */
    private String fileAccessUrl;
    /** 本次扣减积分 */
    private Integer deductedPoints;
    /** 当前积分余额 */
    private Integer currentPointBalance;
    /** 最新下载次数 */
    private Integer downloadCount;

    /**
     * 获取资料ID
     */
    public Long GetMaterialId() {
        return materialId;
    }

    /**
     * 设置资料ID
     */
    public void SetMaterialId(Long materialId) {
        this.materialId = materialId;
    }

    /**
     * 获取文件ID
     */
    public String GetFileId() {
        return fileId;
    }

    /**
     * 设置文件ID
     */
    public void SetFileId(String fileId) {
        this.fileId = fileId;
    }

    /**
     * 获取文件访问地址
     */
    public String GetFileAccessUrl() {
        return fileAccessUrl;
    }

    /**
     * 设置文件访问地址
     */
    public void SetFileAccessUrl(String fileAccessUrl) {
        this.fileAccessUrl = fileAccessUrl;
    }

    /**
     * 获取本次扣减积分
     */
    public Integer GetDeductedPoints() {
        return deductedPoints;
    }

    /**
     * 设置本次扣减积分
     */
    public void SetDeductedPoints(Integer deductedPoints) {
        this.deductedPoints = deductedPoints;
    }

    /**
     * 获取当前积分余额
     */
    public Integer GetCurrentPointBalance() {
        return currentPointBalance;
    }

    /**
     * 设置当前积分余额
     */
    public void SetCurrentPointBalance(Integer currentPointBalance) {
        this.currentPointBalance = currentPointBalance;
    }

    /**
     * 获取下载次数
     */
    public Integer GetDownloadCount() {
        return downloadCount;
    }

    /**
     * 设置下载次数
     */
    public void SetDownloadCount(Integer downloadCount) {
        this.downloadCount = downloadCount;
    }
}
