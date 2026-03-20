package com.xialuo.campusshare.entity;

public class StudyMaterialEntity extends BaseEntity {
    private Long materialId;
    private Long resourceId;
    private String courseName;
    private String tags;
    private String filePath;
    private String fileType;
    private Long fileSizeBytes;
    private Integer downloadCostPoints;
    private Boolean copyrightDeclared;
    private Integer downloadCount;
}
