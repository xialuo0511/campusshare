package com.xialuo.campusshare.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

/**
 * 安全配置
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    /**
     * 构建过滤链
     */
    @Bean
    public SecurityFilterChain BuildSecurityFilterChain(HttpSecurity httpSecurity) throws Exception {
        httpSecurity.csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(authorization -> authorization
                .requestMatchers(
                    "/",
                    "/index.html",
                    "/pages/**",
                    "/favicon.ico",
                    "/error"
                ).permitAll()
                .requestMatchers("/api/v1/**").permitAll()
                .anyRequest().denyAll()
            )
            .headers(headers -> headers
                .frameOptions(frameOptions -> frameOptions.sameOrigin())
            )
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable);
        return httpSecurity.build();
    }
}
