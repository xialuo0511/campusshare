package com.xialuo.campusshare.common.config;

import com.xialuo.campusshare.common.interceptor.IdempotencyInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web配置
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    /** 幂等拦截器 */
    private final IdempotencyInterceptor idempotencyInterceptor;

    public WebMvcConfig(IdempotencyInterceptor idempotencyInterceptor) {
        this.idempotencyInterceptor = idempotencyInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry interceptorRegistry) {
        interceptorRegistry.addInterceptor(idempotencyInterceptor).addPathPatterns("/api/v1/**");
    }
}
