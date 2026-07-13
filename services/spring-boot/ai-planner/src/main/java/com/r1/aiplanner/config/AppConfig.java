package com.r1.aiplanner.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;

@Configuration
public class AppConfig {
    // JdbcTemplate is auto-configured by Spring Boot DataSource
    // This class exists for any additional beans needed
}
