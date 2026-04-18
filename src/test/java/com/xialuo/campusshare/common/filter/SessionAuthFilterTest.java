package com.xialuo.campusshare.common.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.xialuo.campusshare.module.user.mapper.UserMapper;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.mockito.Mockito.mock;

/**
 * 会话认证过滤器测试
 */
class SessionAuthFilterTest {

    /**
     * 受保护接口缺少令牌应返回未登录
     */
    @Test
    void ProtectedApiWithoutTokenShouldFail() throws Exception {
        SessionAuthFilter sessionAuthFilter = BuildFilter();
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
        SessionAuthFilter sessionAuthFilter = BuildFilter();
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/products");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        sessionAuthFilter.doFilter(request, response, filterChain);

        Assertions.assertNotNull(filterChain.getRequest());
        Assertions.assertEquals("", response.getContentAsString());
    }

    /**
     * 构建过滤器
     */
    private SessionAuthFilter BuildFilter() {
        StringRedisTemplate stringRedisTemplate = mock(StringRedisTemplate.class);
        UserMapper userMapper = mock(UserMapper.class);
        ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
        return new SessionAuthFilter(stringRedisTemplate, userMapper, objectMapper);
    }
}
