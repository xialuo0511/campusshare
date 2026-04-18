package com.xialuo.campusshare.module.admin.constant;

/**
 * 系统规则键常量
 */
public final class SystemRuleKeyConstants {
    /** 资料上传是否需要审核 */
    public static final String MATERIAL_REVIEW_REQUIRED = "MATERIAL_REVIEW_REQUIRED";
    /** 资料上传奖励积分 */
    public static final String MATERIAL_UPLOAD_REWARD_POINTS = "MATERIAL_UPLOAD_REWARD_POINTS";
    /** 资料下载消耗积分 */
    public static final String MATERIAL_DOWNLOAD_COST_POINTS = "MATERIAL_DOWNLOAD_COST_POINTS";
    /** 资料文件大小上限 */
    public static final String MATERIAL_FILE_MAX_SIZE_MB = "MATERIAL_FILE_MAX_SIZE_MB";
    /** 资料文件扩展名白名单 */
    public static final String MATERIAL_FILE_ALLOWED_EXTENSIONS = "MATERIAL_FILE_ALLOWED_EXTENSIONS";

    /** 订单超时自动关闭开关 */
    public static final String ORDER_AUTO_CLOSE_ENABLED = "ORDER_AUTO_CLOSE_ENABLED";
    /** 待卖家确认超时时间 */
    public static final String ORDER_PENDING_SELLER_CONFIRM_TIMEOUT_MINUTES =
        "ORDER_PENDING_SELLER_CONFIRM_TIMEOUT_MINUTES";
    /** 待买家确认超时时间 */
    public static final String ORDER_PENDING_BUYER_CONFIRM_TIMEOUT_MINUTES =
        "ORDER_PENDING_BUYER_CONFIRM_TIMEOUT_MINUTES";
    /** 自动关单批量大小 */
    public static final String ORDER_AUTO_CLOSE_BATCH_SIZE = "ORDER_AUTO_CLOSE_BATCH_SIZE";

    /** 邮件通知开关 */
    public static final String MAIL_NOTIFICATION_ENABLED = "MAIL_NOTIFICATION_ENABLED";
    /** 邮件通知最大重试次数 */
    public static final String MAIL_NOTIFICATION_MAX_RETRY = "MAIL_NOTIFICATION_MAX_RETRY";
    /** 邮件通知重试间隔分钟 */
    public static final String MAIL_NOTIFICATION_RETRY_INTERVAL_MINUTES =
        "MAIL_NOTIFICATION_RETRY_INTERVAL_MINUTES";
    /** 邮件通知每次调度批量大小 */
    public static final String MAIL_NOTIFICATION_BATCH_SIZE = "MAIL_NOTIFICATION_BATCH_SIZE";
    /** 允许发送邮件的通知类型范围 */
    public static final String MAIL_NOTIFICATION_TYPE_SCOPE = "MAIL_NOTIFICATION_TYPE_SCOPE";

    /** 敏感词列表 */
    public static final String CONTENT_SENSITIVE_WORDS = "CONTENT_SENSITIVE_WORDS";
    /** 敏感词严格模式 */
    public static final String CONTENT_SENSITIVE_STRICT_MODE = "CONTENT_SENSITIVE_STRICT_MODE";

    /**
     * 常量工具类不允许实例化
     */
    private SystemRuleKeyConstants() {
    }
}
