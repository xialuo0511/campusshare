package com.xialuo.campusshare.module.material.dto;

import com.xialuo.campusshare.enums.ResourceStatusEnum;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 资料响应
 */
public class MaterialResponseDto {
    /** 资料ID */
    private Long materialId;
    /** 上传者ID */
    private Long uploaderUserId;
    /** 上传者昵称 */
    private String uploaderDisplayName;
    /** 课程名 */
    private String courseName;
    /** 标签列表 */
    private List<String> tags;
    /** 资料说明 */
    private String description;
    /** 文件ID */
    private String fileId;
    /** 文件类型 */
    private String fileType;
    /** 文件大小 */
    private Long fileSizeBytes;
    /** 资料状态 */
    private ResourceStatusEnum materialStatus;
    /** 下载消耗积分 */
    private Integer downloadCostPoints;
    /** 版权声明 */
    private Boolean copyrightDeclared;
    /** 下载次数 */
    private Integer downloadCount;
    /** 审核备注 */
    private String reviewRemark;
    /** 最近审核时间 */
    private LocalDateTime lastReviewTime;
    /** 创建时间 */
    private LocalDateTime createTime;

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
     * 获取上传者ID
     */
    public Long GetUploaderUserId() {
        return uploaderUserId;
    }

    /**
     * 设置上传者ID
     */
    public void SetUploaderUserId(Long uploaderUserId) {
        this.uploaderUserId = uploaderUserId;
    }

    /**
     * 获取上传者昵称
     */
    public String GetUploaderDisplayName() {
        return uploaderDisplayName;
    }

    /**
     * 设置上传者昵称
     */
    public void SetUploaderDisplayName(String uploaderDisplayName) {
        this.uploaderDisplayName = uploaderDisplayName;
    }

    /**
     * 获取课程名
     */
    public String GetCourseName() {
        return courseName;
    }

    /**
     * 设置课程名
     */
    public void SetCourseName(String courseName) {
        this.courseName = courseName;
    }

    /**
     * 获取标签列表
     */
    public List<String> GetTags() {
        return tags;
    }

    /**
     * 设置标签列表
     */
    public void SetTags(List<String> tags) {
        this.tags = tags;
    }

    /**
     * 获取资料说明
     */
    public String GetDescription() {
        return description;
    }

    /**
     * 设置资料说明
     */
    public void SetDescription(String description) {
        this.description = description;
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
     * 获取文件类型
     */
    public String GetFileType() {
        return fileType;
    }

    /**
     * 设置文件类型
     */
    public void SetFileType(String fileType) {
        this.fileType = fileType;
    }

    /**
     * 获取文件大小
     */
    public Long GetFileSizeBytes() {
        return fileSizeBytes;
    }

    /**
     * 设置文件大小
     */
    public void SetFileSizeBytes(Long fileSizeBytes) {
        this.fileSizeBytes = fileSizeBytes;
    }

    /**
     * 获取资料状态
     */
    public ResourceStatusEnum GetMaterialStatus() {
        return materialStatus;
    }

    /**
     * 设置资料状态
     */
    public void SetMaterialStatus(ResourceStatusEnum materialStatus) {
        this.materialStatus = materialStatus;
    }

    /**
     * 获取下载积分
     */
    public Integer GetDownloadCostPoints() {
        return downloadCostPoints;
    }

    /**
     * 设置下载积分
     */
    public void SetDownloadCostPoints(Integer downloadCostPoints) {
        this.downloadCostPoints = downloadCostPoints;
    }

    /**
     * 获取版权声明
     */
    public Boolean GetCopyrightDeclared() {
        return copyrightDeclared;
    }

    /**
     * 设置版权声明
     */
    public void SetCopyrightDeclared(Boolean copyrightDeclared) {
        this.copyrightDeclared = copyrightDeclared;
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

    /**
     * 获取审核备注
     */
    public String GetReviewRemark() {
        return reviewRemark;
    }

    /**
     * 设置审核备注
     */
    public void SetReviewRemark(String reviewRemark) {
        this.reviewRemark = reviewRemark;
    }

    /**
     * 获取最近审核时间
     */
    public LocalDateTime GetLastReviewTime() {
        return lastReviewTime;
    }

    /**
     * 设置最近审核时间
     */
    public void SetLastReviewTime(LocalDateTime lastReviewTime) {
        this.lastReviewTime = lastReviewTime;
    }

    /**
     * 获取创建时间
     */
    public LocalDateTime GetCreateTime() {
        return createTime;
    }

    /**
     * 设置创建时间
     */
    public void SetCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }
}
