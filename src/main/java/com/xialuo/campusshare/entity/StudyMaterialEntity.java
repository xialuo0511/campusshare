package com.xialuo.campusshare.entity;

/**
 * 学习资料实体
 */
public class StudyMaterialEntity extends BaseEntity {
    private Long materialId; // 资料ID
    private Long resourceId; // 关联资源ID
    private String courseName; // 课程名
    private String tags; // 标签
    private String filePath; // 文件路径
    private String fileType; // 文件类型
    private Long fileSizeBytes; // 文件大小
    private Integer downloadCostPoints; // 下载消耗积分
    private Boolean copyrightDeclared; // 是否声明版权
    private Integer downloadCount; // 下载次数
}
