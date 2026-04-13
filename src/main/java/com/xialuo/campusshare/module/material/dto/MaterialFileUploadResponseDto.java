package com.xialuo.campusshare.module.material.dto;

/**
 * 资料文件上传响应
 */
public class MaterialFileUploadResponseDto {
    /** 文件ID */
    private String fileId;
    /** 文件名 */
    private String fileName;
    /** 文件类型 */
    private String fileType;
    /** 文件大小 */
    private Long fileSizeBytes;

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
     * 获取文件名
     */
    public String GetFileName() {
        return fileName;
    }

    /**
     * 设置文件名
     */
    public void SetFileName(String fileName) {
        this.fileName = fileName;
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
}
