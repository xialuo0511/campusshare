package com.xialuo.campusshare.common.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.common.util.SessionTokenUtil;
import com.xialuo.campusshare.entity.UserEntity;
import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.enums.UserStatusEnum;
import com.xialuo.campusshare.module.user.mapper.UserMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * 会话认证过滤器
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 2)
public class SessionAuthFilter extends OncePerRequestFilter {
    /** 鉴权请求头 */
    public static final String AUTH_TOKEN_HEADER = "X-Auth-Token";
    /** 当前用户ID属性 */
    public static final String CURRENT_USER_ID_ATTRIBUTE = "currentUserId";
    /** 当前用户角色属性 */
    public static final String CURRENT_USER_ROLE_ATTRIBUTE = "currentUserRole";
    /** 会话缓存前缀 */
    private static final String USER_SESSION_PREFIX = "campusshare:user:session:";
    /** 会话续期时长 */
    private static final Duration USER_SESSION_TTL = Duration.ofDays(7);
    /** 招募详情公开路径 */
    private static final Pattern TEAM_RECRUITMENT_DETAIL_PATH_PATTERN =
        Pattern.compile("^/api/v1/team/recruitments/\\d+$");
    /** 商品详情公开路径 */
    private static final Pattern PRODUCT_DETAIL_PATH_PATTERN =
        Pattern.compile("^/api/v1/products/\\d+$");
    /** 商品评论公开路径 */
    private static final Pattern PRODUCT_COMMENT_PATH_PATTERN =
        Pattern.compile("^/api/v1/products/\\d+/comments$");

    /** Redis模板 */
    private final StringRedisTemplate stringRedisTemplate;
    /** 用户Mapper */
    private final UserMapper userMapper;
    /** JSON工具 */
    private final ObjectMapper objectMapper;
    private final String sessionSigningSecret;

    public SessionAuthFilter(
        StringRedisTemplate stringRedisTemplate,
        UserMapper userMapper,
        ObjectMapper objectMapper,
        @Value("${campusshare.session.signing-secret:dev-session-signing-secret-change-me}") String sessionSigningSecret
    ) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.userMapper = userMapper;
        this.objectMapper = objectMapper;
        this.sessionSigningSecret = sessionSigningSecret;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String requestPath = request.getRequestURI();

        if (!requestPath.startsWith("/api/v1/")) {
            filterChain.doFilter(request, response);
            return;
        }
        if (IsPublicPath(request)) {
            TryBindOptionalUserContext(request);
            filterChain.doFilter(request, response);
            return;
        }

        String token = request.getHeader(AUTH_TOKEN_HEADER);
        if (token == null || token.isBlank()) {
            WriteFailureResponse(response, request, BizCodeEnum.UNAUTHORIZED, "未登录或登录已失效");
            return;
        }

        UserEntity userEntity = ResolveUserByToken(token);
        if (userEntity == null) {
            WriteFailureResponse(response, request, BizCodeEnum.UNAUTHORIZED, "未登录或登录已失效");
            return;
        }

        request.setAttribute(CURRENT_USER_ID_ATTRIBUTE, userEntity.GetUserId());
        request.setAttribute(CURRENT_USER_ROLE_ATTRIBUTE, userEntity.GetUserRole());

        if (requestPath.startsWith("/api/v1/admin/")
            && userEntity.GetUserRole() != UserRoleEnum.ADMINISTRATOR) {
            WriteFailureResponse(response, request, BizCodeEnum.FORBIDDEN, "当前账号无管理员权限");
            return;
        }

        filterChain.doFilter(request, response);
    }

    /**
     * 是否公开路径
     */
    private boolean IsPublicPath(HttpServletRequest request) {
        String requestPath = request.getRequestURI();
        String requestMethod = request.getMethod();
        return "/api/v1/users/register".equals(requestPath)
            || "/api/v1/users/register/code/send".equals(requestPath)
            || "/api/v1/users/login".equals(requestPath)
            || "/api/v1/system/health".equals(requestPath)
            || (IsGetMethod(requestMethod) && requestPath.startsWith("/api/v1/files/"))
            || (IsGetMethod(requestMethod) && IsPublicProductGetPath(requestPath))
            || (IsGetMethod(requestMethod) && "/api/v1/materials/public".equals(requestPath))
            || (IsGetMethod(requestMethod) && "/api/v1/market/overview".equals(requestPath))
            || (IsGetMethod(requestMethod)
                && ("/api/v1/team/recruitments".equals(requestPath)
                || TEAM_RECRUITMENT_DETAIL_PATH_PATTERN.matcher(requestPath).matches()));
    }

    /**
     * 商品公开GET路径
     */
    private boolean IsPublicProductGetPath(String requestPath) {
        return "/api/v1/products".equals(requestPath)
            || PRODUCT_DETAIL_PATH_PATTERN.matcher(requestPath).matches()
            || PRODUCT_COMMENT_PATH_PATTERN.matcher(requestPath).matches();
    }

    /**
     * 公开接口尝试绑定用户上下文
     */
    private void TryBindOptionalUserContext(HttpServletRequest request) {
        String token = request.getHeader(AUTH_TOKEN_HEADER);
        if (token == null || token.isBlank()) {
            return;
        }
        UserEntity userEntity = ResolveUserByToken(token);
        if (userEntity == null) {
            return;
        }
        request.setAttribute(CURRENT_USER_ID_ATTRIBUTE, userEntity.GetUserId());
        request.setAttribute(CURRENT_USER_ROLE_ATTRIBUTE, userEntity.GetUserRole());
    }

    /**
     * 解析会话用户
     */
    private UserEntity ResolveUserByToken(String token) {
        String sessionKey = USER_SESSION_PREFIX + token;
        String sessionValue;
        try {
            sessionValue = stringRedisTemplate.opsForValue().get(sessionKey);
        } catch (Exception exception) {
            return null;
        }
        Long userId = SessionTokenUtil.ResolveUserId(token, sessionValue, sessionSigningSecret);
        if (userId == null) {
            return null;
        }
        UserEntity userEntity = userMapper.FindUserById(userId);
        if (userEntity == null || userEntity.GetUserStatus() != UserStatusEnum.ACTIVE) {
            return null;
        }
        RefreshSessionTtl(sessionKey);
        return userEntity;
    }

    /**
     * 刷新会话过期时间
     */
    private void RefreshSessionTtl(String sessionKey) {
        try {
            stringRedisTemplate.expire(sessionKey, USER_SESSION_TTL);
        } catch (Exception exception) {
            // Redis异常不阻断鉴权流程
        }
    }

    /**
     * 判断GET方法
     */
    private boolean IsGetMethod(String requestMethod) {
        return requestMethod != null && "GET".equalsIgnoreCase(requestMethod);
    }

    /**
     * 写失败响应
     */
    private void WriteFailureResponse(
        HttpServletResponse response,
        HttpServletRequest request,
        BizCodeEnum bizCodeEnum,
        String message
    ) throws IOException {
        Object requestId = request.getAttribute(RequestIdFilter.REQUEST_ID_ATTRIBUTE);
        String requestIdText = requestId == null ? "" : requestId.toString();
        ApiResponse<Object> responseBody = ApiResponse.Failure(bizCodeEnum, message, requestIdText);

        response.setStatus(HttpServletResponse.SC_OK);
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");
        objectMapper.writeValue(response.getWriter(), responseBody);
    }
}
