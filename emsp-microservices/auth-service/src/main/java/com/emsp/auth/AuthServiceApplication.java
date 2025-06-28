package com.awms.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * 认证服务启动类
 */
@SpringBootApplication
@EnableDiscoveryClient
public class AuthServiceApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }
} 