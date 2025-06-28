package com.emsp.moment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class MomentServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(MomentServiceApplication.class, args);
    }
} 