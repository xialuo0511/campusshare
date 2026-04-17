package com.xialuo.campusshare.module.governance.enums;

import java.util.Locale;

/**
 * 举报处置动作枚举
 */
public enum ReportDispositionActionEnum {
    /** 不执行处置 */
    NONE,
    /** 保留记录 */
    KEEP,
    /** 下架资源 */
    OFFLINE_RESOURCE,
    /** 隐藏评论 */
    HIDE_COMMENT,
    /** 冻结用户 */
    FREEZE_USER;

    /**
     * 解析动作
     */
    public static ReportDispositionActionEnum ResolveFromText(String actionText) {
        if (actionText == null || actionText.isBlank()) {
            return null;
        }
        String normalizedActionText = actionText.trim().toUpperCase(Locale.ROOT);
        if ("WARN".equals(normalizedActionText) || "KEEP_RECORD".equals(normalizedActionText) || "保留".equals(actionText.trim())) {
            return KEEP;
        }
        if ("IGNORE".equals(normalizedActionText) || "REJECTED_NO_ACTION".equals(normalizedActionText) || "驳回".equals(actionText.trim())) {
            return NONE;
        }
        for (ReportDispositionActionEnum actionEnum : values()) {
            if (actionEnum.name().equals(normalizedActionText)) {
                return actionEnum;
            }
        }
        return null;
    }
}
