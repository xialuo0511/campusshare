package com.xialuo.campusshare.module.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * 提交卖家认证申请请求
 */
public class SellerVerificationApplyRequestDto {
    /** 真实姓名 */
    @NotBlank(message = "真实姓名不能为空")
    @Size(min = 1, max = 50, message = "真实姓名长度需在1到50")
    private String realName;

    /** 联系电话 */
    @Size(max = 30, message = "联系电话长度不能超过30")
    private String contactPhone;

    /** 资质说明 */
    @NotBlank(message = "资质说明不能为空")
    @Size(min = 1, max = 500, message = "资质说明长度需在1到500")
    private String qualificationDesc;

    /** 资质文件ID列表 */
    @Size(max = 10, message = "资质文件数量不能超过10")
    private List<String> credentialFileIds;

    /**
     * 获取真实姓名
     */
    public String GetRealName() {
        return realName;
    }

    /**
     * 设置真实姓名
     */
    public void SetRealName(String realName) {
        this.realName = realName;
    }

    /**
     * 获取联系电话
     */
    public String GetContactPhone() {
        return contactPhone;
    }

    /**
     * 设置联系电话
     */
    public void SetContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    /**
     * 获取资质说明
     */
    public String GetQualificationDesc() {
        return qualificationDesc;
    }

    /**
     * 设置资质说明
     */
    public void SetQualificationDesc(String qualificationDesc) {
        this.qualificationDesc = qualificationDesc;
    }

    /**
     * 获取资质文件ID列表
     */
    public List<String> GetCredentialFileIds() {
        return credentialFileIds;
    }

    /**
     * 设置资质文件ID列表
     */
    public void SetCredentialFileIds(List<String> credentialFileIds) {
        this.credentialFileIds = credentialFileIds;
    }
}

