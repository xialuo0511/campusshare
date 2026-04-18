package com.xialuo.campusshare;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 项目启动类
 */
@SpringBootApplication
@EnableScheduling
public class CampusshareApplication {

    /**
     * 启动入口
     */
    public static void main(String[] args) {
        SpringApplication.run(CampusshareApplication.class, args);
    }

}
