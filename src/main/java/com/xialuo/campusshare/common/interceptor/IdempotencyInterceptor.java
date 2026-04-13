package com.xialuo.campusshare.common.interceptor;

import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.exception.BusinessException;
import com.xialuo.campusshare.common.filter.RequestIdFilter;
import com.xialuo.campusshare.common.filter.SessionAuthFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.util.Set;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 幂等拦截器
 */
@Component
public class IdempotencyInterceptor implements HandlerInterceptor {
    /** 幂等键属性 */
    public static final String IDEMPOTENCY_KEY_ATTRIBUTE = "idempotencyKey";
    /** 幂等键前缀 */
    private static final String IDEMPOTENCY_KEY_PREFIX = "campusshare:idempotency:";
    /** 幂等生效方法 */
    private static final Set<String> IDEMPOTENCY_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");
    /** 幂等有效时长 */
    private static final Duration IDEMPOTENCY_TTL = Duration.ofMinutes(10);

    /** Redis模板 */
    private final StringRedisTemplate stringRedisTemplate;

    public IdempotencyInterceptor(StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!NeedCheckIdempotency(request)) {
            return true;
        }

        String requestIdHeader = request.getHeader(RequestIdFilter.REQUEST_ID_HEADER);
        if (requestIdHeader == null || requestIdHeader.isBlank()) {
            return true;
        }

        String requestId = ResolveRequestId(request, requestIdHeader);
        String idempotencyKey = BuildIdempotencyKey(request, requestId);
        Boolean lockSuccess = stringRedisTemplate.opsForValue().setIfAbsent(
            idempotencyKey,
            "1",
            IDEMPOTENCY_TTL
        );
        if (!Boolean.TRUE.equals(lockSuccess)) {
            throw new BusinessException(BizCodeEnum.IDEMPOTENCY_CONFLICT, "请勿重复提交同一请求");
        }
        request.setAttribute(IDEMPOTENCY_KEY_ATTRIBUTE, idempotencyKey);
        return true;
    }

    @Override
    public void afterCompletion(
        HttpServletRequest request,
        HttpServletResponse response,
        Object handler,
        Exception exception
    ) {
        Object idempotencyKeyObject = request.getAttribute(IDEMPOTENCY_KEY_ATTRIBUTE);
        if (idempotencyKeyObject == null) {
            return;
        }
        String idempotencyKey = idempotencyKeyObject.toString();
        if (exception != null || response.getStatus() >= 500) {
            stringRedisTemplate.delete(idempotencyKey);
        }
    }

    /**
     * 是否需要校验幂等
     */
    private boolean NeedCheckIdempotency(HttpServletRequest request) {
        if (!IDEMPOTENCY_METHODS.contains(request.getMethod())) {
            return false;
        }
        String requestUri = request.getRequestURI();
        return requestUri != null && requestUri.startsWith("/api/v1/");
    }

    /**
     * 构建幂等键
     */
    private String BuildIdempotencyKey(HttpServletRequest request, String requestId) {
        String requestUri = request.getRequestURI();
        String requestMethod = request.getMethod();
        String userSegment = ResolveCurrentUserSegment(request);
        String pathSegment = requestUri == null ? "" : requestUri.replace("/", ":");
        return IDEMPOTENCY_KEY_PREFIX + requestMethod + ":" + userSegment + ":" + pathSegment + ":" + requestId;
    }

    /**
     * 获取当前用户段
     */
    private String ResolveCurrentUserSegment(HttpServletRequest request) {
        Object currentUserId = request.getAttribute(SessionAuthFilter.CURRENT_USER_ID_ATTRIBUTE);
        return currentUserId == null ? "anonymous" : currentUserId.toString();
    }

    /**
     * 获取请求ID
     */
    private String ResolveRequestId(HttpServletRequest request, String requestIdHeader) {
        Object requestIdAttribute = request.getAttribute(RequestIdFilter.REQUEST_ID_ATTRIBUTE);
        if (requestIdAttribute != null && !requestIdAttribute.toString().isBlank()) {
            return requestIdAttribute.toString();
        }
        return requestIdHeader;
    }
}
