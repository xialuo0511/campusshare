package com.xialuo.campusshare.common.enums;

/**
 * 业务码枚举
 */
public enum BizCodeEnum {
    /** 成功 */
    SUCCESS(0, "success"),
    /** 参数校验失败 */
    PARAM_INVALID(1001, "参数校验失败"),
    /** 未认证 */
    UNAUTHORIZED(1002, "未认证"),
    /** 无权限 */
    FORBIDDEN(1003, "无权限"),
    /** 资源不存在 */
    RESOURCE_NOT_FOUND(1004, "资源不存在"),
    /** 业务冲突 */
    BUSINESS_CONFLICT(1005, "业务冲突"),
    /** 账号已存在 */
    ACCOUNT_EXISTS(1006, "账号已存在"),
    /** 账号未审核通过 */
    ACCOUNT_NOT_ACTIVE(1007, "账号未审核通过"),
    /** 用户不存在 */
    USER_NOT_FOUND(1008, "用户不存在"),
    /** 密码错误 */
    PASSWORD_INVALID(1009, "密码错误"),
    /** 系统异常 */
    SYSTEM_ERROR(1999, "系统异常");

    /** 业务码 */
    private final Integer code;
    /** 默认消息 */
    private final String message;

    BizCodeEnum(Integer code, String message) {
        this.code = code;
        this.message = message;
    }

    /**
     * 获取业务码
     */
    public Integer GetCode() {
        return code;
    }

    /**
     * 获取默认消息
     */
    public String GetMessage() {
        return message;
    }
}
