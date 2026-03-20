package com.xialuo.campusshare.entity;

/**
 * 学习资料实体
 */
public class StudyMaterialEntity extends BaseEntity {
    /** 资料ID */
    private Long materialId;
    /** 关联资源ID */
    private Long resourceId;
    /** 课程名 */
    private String courseName;
    /** 标签 */
    private String tags;
    /** 文件路径 */
    private String filePath;
    /** 文件类型 */
    private String fileType;
    /** 文件大小 */
    private Long fileSizeBytes;
    /** 下载消耗积分 */
    private Integer downloadCostPoints;
    /** 是否声明版权 */
    private Boolean copyrightDeclared;
    /** 下载次数 */
    private Integer downloadCount;
}


