package com.xialuo.campusshare.common.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.xialuo.campusshare.entity.UserEntity;
import com.xialuo.campusshare.enums.UserRoleEnum;
import com.xialuo.campusshare.enums.UserStatusEnum;
import com.xialuo.campusshare.common.util.SessionTokenUtil;
import com.xialuo.campusshare.module.user.mapper.UserMapper;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 会话认证过滤器测试
 */
class SessionAuthFilterTest {
    /** 普通用户令牌 */
    private static final String MEMBER_TOKEN = "token-member";
    /** 管理员令牌 */
    private static final String ADMIN_TOKEN = "token-admin";
    /** 娴嬭瘯浼氳瘽绛惧悕瀵嗛挜 */
    private static final String SESSION_SIGNING_SECRET = "test-session-secret";

    /**
     * 受保护接口缺少令牌应返回未登录
     */
    @Test
    void ProtectedApiWithoutTokenShouldFail() throws Exception {
        SessionAuthFilter sessionAuthFilter = BuildFilter(false, false);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/products/my");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        sessionAuthFilter.doFilter(request, response, filterChain);

        Assertions.assertEquals(200, response.getStatus());
        Assertions.assertNull(filterChain.getRequest());
    }

    /**
     * 商品列表公开接口可匿名访问
     */
    @Test
    void PublicProductApiWithoutTokenShouldPass() throws Exception {
        SessionAuthFilter sessionAuthFilter = BuildFilter(false, false);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/products");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        sessionAuthFilter.doFilter(request, response, filterChain);

        Assertions.assertNotNull(filterChain.getRequest());
        Assertions.assertEquals("", response.getContentAsString());
    }

    /**
     * 普通用户访问管理员接口应被拒绝
     */
    @Test
    void MemberAccessAdminApiShouldFail() throws Exception {
        SessionAuthFilter sessionAuthFilter = BuildFilter(true, false);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/admin/orders");
        request.addHeader(SessionAuthFilter.AUTH_TOKEN_HEADER, MEMBER_TOKEN);
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        sessionAuthFilter.doFilter(request, response, filterChain);

        Assertions.assertEquals(200, response.getStatus());
        Assertions.assertNull(filterChain.getRequest());
        Assertions.assertFalse(response.getContentAsString().isBlank());
    }

    /**
     * 管理员访问管理员接口应放行
     */
    @Test
    void AdministratorAccessAdminApiShouldPass() throws Exception {
        SessionAuthFilter sessionAuthFilter = BuildFilter(true, true);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/admin/orders");
        request.addHeader(SessionAuthFilter.AUTH_TOKEN_HEADER, ADMIN_TOKEN);
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        sessionAuthFilter.doFilter(request, response, filterChain);

        Assertions.assertNotNull(filterChain.getRequest());
        Assertions.assertEquals(200, response.getStatus());
    }

    @Test
    void RawRedisSessionValueShouldFail() throws Exception {
        StringRedisTemplate stringRedisTemplate = mock(StringRedisTemplate.class);
        UserMapper userMapper = mock(UserMapper.class);
        @SuppressWarnings("unchecked")
        ValueOperations<String, String> valueOperations = mock(ValueOperations.class);
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("campusshare:user:session:" + MEMBER_TOKEN)).thenReturn("2");

        ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
        SessionAuthFilter sessionAuthFilter = new SessionAuthFilter(
            stringRedisTemplate,
            userMapper,
            objectMapper,
            SESSION_SIGNING_SECRET
        );
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/products/my");
        request.addHeader(SessionAuthFilter.AUTH_TOKEN_HEADER, MEMBER_TOKEN);
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        sessionAuthFilter.doFilter(request, response, filterChain);

        Assertions.assertEquals(200, response.getStatus());
        Assertions.assertNull(filterChain.getRequest());
    }

    /**
     * 构建过滤器
     */
    private SessionAuthFilter BuildFilter(boolean includeMemberSession, boolean includeAdminSession) {
        StringRedisTemplate stringRedisTemplate = mock(StringRedisTemplate.class);
        UserMapper userMapper = mock(UserMapper.class);
        @SuppressWarnings("unchecked")
        ValueOperations<String, String> valueOperations = mock(ValueOperations.class);
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);

        if (includeMemberSession) {
            when(valueOperations.get("campusshare:user:session:" + MEMBER_TOKEN))
                .thenReturn(SessionTokenUtil.BuildSessionValue(MEMBER_TOKEN, 2L, SESSION_SIGNING_SECRET));
            when(userMapper.FindUserById(2L)).thenReturn(BuildUser(2L, UserRoleEnum.STUDENT));
        }
        if (includeAdminSession) {
            when(valueOperations.get("campusshare:user:session:" + ADMIN_TOKEN))
                .thenReturn(SessionTokenUtil.BuildSessionValue(ADMIN_TOKEN, 1L, SESSION_SIGNING_SECRET));
            when(userMapper.FindUserById(1L)).thenReturn(BuildUser(1L, UserRoleEnum.ADMINISTRATOR));
        }

        ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
        return new SessionAuthFilter(stringRedisTemplate, userMapper, objectMapper, SESSION_SIGNING_SECRET);
    }

    /**
     * 构建测试用户
     */
    private UserEntity BuildUser(Long userId, UserRoleEnum userRole) {
        UserEntity userEntity = new UserEntity();
        userEntity.SetUserId(userId);
        userEntity.SetUserRole(userRole);
        userEntity.SetUserStatus(UserStatusEnum.ACTIVE);
        return userEntity;
    }
}
