package com.xialuo.campusshare.module.material.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * 上传资料请求
 */
public class UploadMaterialRequestDto {
    /** 课程名 */
    @NotBlank(message = "课程名不能为空")
    @Size(min = 1, max = 100, message = "课程名长度需在1到100")
    private String courseName;

    /** 标签列表 */
    private List<String> tags;

    /** 资料说明 */
    @Size(max = 1000, message = "资料说明长度不能超过1000")
    private String description;

    /** 文件ID */
    @NotBlank(message = "文件ID不能为空")
    private String fileId;

    /** 文件类型 */
    @NotBlank(message = "文件类型不能为空")
    private String fileType;

    /** 文件大小 */
    @NotNull(message = "文件大小不能为空")
    private Long fileSizeBytes;

    /** 版权声明确认 */
    @AssertTrue(message = "请勾选版权声明")
    private Boolean copyrightDeclared;

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
}
