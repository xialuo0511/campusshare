package com.xialuo.campusshare.module.resource.dto;

/**
 * 商品图片上传响应
 */
public class ProductImageUploadResponseDto {
    /** 文件ID */
    private String fileId;
    /** 文件名 */
    private String fileName;
    /** 文件类型 */
    private String fileType;
    /** 文件大小 */
    private Long fileSizeBytes;

    public String GetFileId() {
        return fileId;
    }

    public void SetFileId(String fileId) {
        this.fileId = fileId;
    }

    public String GetFileName() {
        return fileName;
    }

    public void SetFileName(String fileName) {
        this.fileName = fileName;
    }

    public String GetFileType() {
        return fileType;
    }

    public void SetFileType(String fileType) {
        this.fileType = fileType;
    }

    public Long GetFileSizeBytes() {
        return fileSizeBytes;
    }

    public void SetFileSizeBytes(Long fileSizeBytes) {
        this.fileSizeBytes = fileSizeBytes;
    }
}
