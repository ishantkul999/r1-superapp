package com.r1.porter;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PorterServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(PorterServiceApplication.class, args);
    }
}
