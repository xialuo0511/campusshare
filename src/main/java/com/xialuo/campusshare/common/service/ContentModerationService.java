package com.xialuo.campusshare.common.service;

import java.util.List;

/**
 * 文本内容治理服务
 */
public interface ContentModerationService {
    /**
     * 校验文本是否包含敏感词
     */
    void ValidateNoSensitiveWords(List<String> contentTextList, String sceneName);
}
