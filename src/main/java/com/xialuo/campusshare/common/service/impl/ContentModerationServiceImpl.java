package com.xialuo.campusshare.common.service.impl;

import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.common.service.ContentModerationService;
import com.xialuo.campusshare.module.admin.constant.SystemRuleKeyConstants;
import com.xialuo.campusshare.module.admin.service.SystemRuleConfigService;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import org.springframework.stereotype.Service;

/**
 * 文本内容治理服务实现
 */
@Service
public class ContentModerationServiceImpl implements ContentModerationService {
    /** 默认敏感词 */
    private static final String DEFAULT_SENSITIVE_WORDS = "赌博,色情,诈骗";
    /** 默认严格模式 */
    private static final Boolean DEFAULT_STRICT_MODE = Boolean.TRUE;

    /** 规则服务 */
    private final SystemRuleConfigService systemRuleConfigService;

    public ContentModerationServiceImpl(SystemRuleConfigService systemRuleConfigService) {
        this.systemRuleConfigService = systemRuleConfigService;
    }

    @Override
    public void ValidateNoSensitiveWords(List<String> contentTextList, String sceneName) {
        Boolean strictMode = systemRuleConfigService.GetRuleBooleanValueOrDefault(
            SystemRuleKeyConstants.CONTENT_SENSITIVE_STRICT_MODE,
            DEFAULT_STRICT_MODE
        );
        if (!Boolean.TRUE.equals(strictMode)) {
            return;
        }

        List<String> sensitiveWordList = ResolveSensitiveWords();
        if (sensitiveWordList.isEmpty() || contentTextList == null || contentTextList.isEmpty()) {
            return;
        }

        for (String contentText : contentTextList) {
            String normalizedText = NormalizeText(contentText).toLowerCase(Locale.ROOT);
            if (normalizedText.isBlank()) {
                continue;
            }
            for (String sensitiveWord : sensitiveWordList) {
                if (normalizedText.contains(sensitiveWord)) {
                    throw new BusinessException(
                        BizCodeEnum.PARAM_INVALID,
                        BuildSensitiveWordErrorMessage(sceneName, sensitiveWord)
                    );
                }
            }
        }
    }

    /**
     * 解析敏感词列表
     */
    private List<String> ResolveSensitiveWords() {
        String sensitiveWordText = systemRuleConfigService.GetRuleValueOrDefault(
            SystemRuleKeyConstants.CONTENT_SENSITIVE_WORDS,
            DEFAULT_SENSITIVE_WORDS
        );
        return Arrays.stream(NormalizeText(sensitiveWordText).split(","))
            .map(this::NormalizeText)
            .map(item -> item.toLowerCase(Locale.ROOT))
            .filter(item -> !item.isBlank())
            .filter(Objects::nonNull)
            .distinct()
            .toList();
    }

    /**
     * 构建错误信息
     */
    private String BuildSensitiveWordErrorMessage(String sceneName, String sensitiveWord) {
        String safeSceneName = NormalizeText(sceneName);
        if (safeSceneName.isBlank()) {
            return "提交内容包含敏感词: " + sensitiveWord;
        }
        return safeSceneName + "包含敏感词: " + sensitiveWord;
    }

    /**
     * 文本规范化
     */
    private String NormalizeText(String text) {
        return text == null ? "" : text.trim();
    }
}
