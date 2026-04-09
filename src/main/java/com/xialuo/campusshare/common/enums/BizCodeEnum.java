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
    /** 商品不存在 */
    PRODUCT_NOT_FOUND(1010, "商品不存在"),
    /** 商品不可下单 */
    PRODUCT_UNAVAILABLE(1011, "商品不可下单"),
    /** 订单不存在 */
    ORDER_NOT_FOUND(1012, "订单不存在"),
    /** 订单状态非法 */
    ORDER_STATUS_INVALID(1013, "订单状态非法"),
    /** 订单无操作权限 */
    ORDER_PERMISSION_DENIED(1014, "订单无操作权限"),
    /** 禁止购买自己商品 */
    ORDER_SELF_PURCHASE_DENIED(1015, "禁止购买自己商品"),
    /** 资料不存在 */
    MATERIAL_NOT_FOUND(1016, "资料不存在"),
    /** 资料状态非法 */
    MATERIAL_STATUS_INVALID(1017, "资料状态非法"),
    /** 资料无操作权限 */
    MATERIAL_PERMISSION_DENIED(1018, "资料无操作权限"),
    /** 举报不存在 */
    REPORT_NOT_FOUND(1019, "举报不存在"),
    /** 举报状态非法 */
    REPORT_STATUS_INVALID(1020, "举报状态非法"),
    /** 举报无操作权限 */
    REPORT_PERMISSION_DENIED(1021, "举报无操作权限"),
    /** 积分余额不足 */
    POINT_BALANCE_INSUFFICIENT(1022, "积分余额不足"),
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
