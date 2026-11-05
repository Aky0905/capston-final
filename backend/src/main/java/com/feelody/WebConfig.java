package com.feelody;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Value("${CORS_ORIGINS:http://localhost:8081,http://localhost:8082}") private String origins;
    @Override public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**").allowedOrigins(origins.split(",")).allowedMethods("GET", "POST", "OPTIONS")
                .allowedHeaders("Authorization", "Content-Type").maxAge(3600);
    }
}
