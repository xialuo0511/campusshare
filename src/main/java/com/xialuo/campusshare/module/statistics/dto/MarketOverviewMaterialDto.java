package com.xialuo.campusshare.module.statistics.dto;

import java.time.LocalDateTime;

/**
 * 总览资料信息
 */
public class MarketOverviewMaterialDto {
    /** 资料ID */
    private Long materialId;
    /** 课程名 */
    private String courseName;
    /** 文件类型 */
    private String fileType;
    /** 文件大小 */
    private Long fileSizeBytes;
    /** 下载次数 */
    private Integer downloadCount;
    /** 上传者昵称 */
    private String uploaderDisplayName;
    /** 发布时间 */
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
     * 获取发布时间
     */
    public LocalDateTime GetCreateTime() {
        return createTime;
    }

    /**
     * 设置发布时间
     */
    public void SetCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }
}
