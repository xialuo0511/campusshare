package com.xialuo.campusshare.common.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.xialuo.campusshare.common.api.ApiResponse;
import com.xialuo.campusshare.common.enums.BizCodeEnum;
import com.xialuo.campusshare.entity.UserEntity;
import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.enums.UserStatusEnum;
import com.xialuo.campusshare.module.user.mapper.UserMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
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

    /** Redis模板 */
    private final StringRedisTemplate stringRedisTemplate;
    /** 用户Mapper */
    private final UserMapper userMapper;
    /** JSON工具 */
    private final ObjectMapper objectMapper;

    public SessionAuthFilter(StringRedisTemplate stringRedisTemplate, UserMapper userMapper, ObjectMapper objectMapper) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.userMapper = userMapper;
        this.objectMapper = objectMapper;
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
        if (IsPublicPath(requestPath)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = request.getHeader(AUTH_TOKEN_HEADER);
        if (token == null || token.isBlank()) {
            WriteFailureResponse(response, request, BizCodeEnum.UNAUTHORIZED, "未登录或登录已失效");
            return;
        }

        String userIdText = stringRedisTemplate.opsForValue().get(USER_SESSION_PREFIX + token);
        if (userIdText == null || userIdText.isBlank()) {
            WriteFailureResponse(response, request, BizCodeEnum.UNAUTHORIZED, "未登录或登录已失效");
            return;
        }

        Long userId;
        try {
            userId = Long.parseLong(userIdText);
        } catch (NumberFormatException exception) {
            WriteFailureResponse(response, request, BizCodeEnum.UNAUTHORIZED, "会话数据异常");
            return;
        }

        UserEntity userEntity = userMapper.FindUserById(userId);
        if (userEntity == null || userEntity.GetUserStatus() != UserStatusEnum.ACTIVE) {
            WriteFailureResponse(response, request, BizCodeEnum.UNAUTHORIZED, "账号状态异常");
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
    private boolean IsPublicPath(String requestPath) {
        return "/api/v1/users/register".equals(requestPath)
            || "/api/v1/users/register/code/send".equals(requestPath)
            || "/api/v1/users/login".equals(requestPath);
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
