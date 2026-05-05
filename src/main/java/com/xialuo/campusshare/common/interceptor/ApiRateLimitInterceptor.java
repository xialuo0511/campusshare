package com.xialuo.campusshare.common.interceptor;

import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * API限流拦截器
 */
@Component
public class ApiRateLimitInterceptor implements HandlerInterceptor {
    /** 限流键前缀 */
    private static final String RATE_LIMIT_KEY_PREFIX = "campusshare:rate-limit:";
    /** 默认提示 */
    private static final String RATE_LIMIT_DEFAULT_MESSAGE = "请求过于频繁，请稍后再试";
    /** 透传IP头 */
    private static final String FORWARDED_FOR_HEADER = "X-Forwarded-For";

    /** 规则集合 */
    private static final Map<String, RateLimitRule> RATE_LIMIT_RULE_MAP = Map.of(
        "/api/v1/users/login",
        new RateLimitRule(10, Duration.ofMinutes(1), "登录请求过于频繁，请稍后再试"),
        "/api/v1/users/register/code/send",
        new RateLimitRule(5, Duration.ofMinutes(10), "验证码发送过于频繁，请稍后再试"),
        "/api/v1/users/register",
        new RateLimitRule(10, Duration.ofMinutes(10), "注册请求过于频繁，请稍后再试")
    );

    /** Redis模板 */
    private final StringRedisTemplate stringRedisTemplate;
    private final boolean trustForwardedHeaders;

    public ApiRateLimitInterceptor(
        StringRedisTemplate stringRedisTemplate,
        @Value("${campusshare.security.trust-forwarded-headers:false}") boolean trustForwardedHeaders
    ) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.trustForwardedHeaders = trustForwardedHeaders;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String requestPath = request.getRequestURI();
        if (requestPath == null || requestPath.isBlank()) {
            return true;
        }
        RateLimitRule rateLimitRule = RATE_LIMIT_RULE_MAP.get(requestPath);
        if (rateLimitRule == null) {
            return true;
        }
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String clientIp = ResolveClientIp(request);
        String rateLimitKey = BuildRateLimitKey(requestPath, clientIp);

        try {
            Long requestCount = stringRedisTemplate.opsForValue().increment(rateLimitKey);
            if (requestCount != null && requestCount == 1L) {
                stringRedisTemplate.expire(rateLimitKey, rateLimitRule.windowDuration());
            }
            if (requestCount != null && requestCount > rateLimitRule.maxRequestCount()) {
                throw new BusinessException(
                    BizCodeEnum.RATE_LIMIT_EXCEEDED,
                    rateLimitRule.message() == null || rateLimitRule.message().isBlank()
                        ? RATE_LIMIT_DEFAULT_MESSAGE
                        : rateLimitRule.message()
                );
            }
        } catch (BusinessException businessException) {
            throw businessException;
        } catch (Exception exception) {
            throw new BusinessException(BizCodeEnum.SYSTEM_ERROR, "请求限流服务暂不可用，请稍后重试");
        }
        return true;
    }

    /**
     * 构建限流键
     */
    private String BuildRateLimitKey(String requestPath, String clientIp) {
        String normalizedPath = requestPath.replace("/", ":");
        return RATE_LIMIT_KEY_PREFIX + normalizedPath + ":" + clientIp;
    }

    /**
     * 解析客户端IP
     */
    private String ResolveClientIp(HttpServletRequest request) {
        String forwardedForValue = trustForwardedHeaders ? request.getHeader(FORWARDED_FOR_HEADER) : null;
        if (forwardedForValue != null && !forwardedForValue.isBlank()) {
            String[] ipList = forwardedForValue.split(",");
            if (ipList.length > 0 && ipList[0] != null && !ipList[0].trim().isBlank()) {
                return NormalizeIp(ipList[0].trim());
            }
        }
        return NormalizeIp(request.getRemoteAddr());
    }

    /**
     * 规范化IP
     */
    private String NormalizeIp(String ip) {
        if (ip == null || ip.isBlank()) {
            return "unknown";
        }
        return ip.replace(":", "_");
    }

    /**
     * 限流规则
     */
    private record RateLimitRule(
        int maxRequestCount,
        Duration windowDuration,
        String message
    ) {}
}
