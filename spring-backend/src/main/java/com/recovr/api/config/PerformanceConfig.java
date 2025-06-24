package com.recovr.api.config;

// import org.springframework.boot.actuator.web.exchanges.HttpExchangeRepository;
// import org.springframework.boot.actuator.web.exchanges.InMemoryHttpExchangeRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@Configuration
@EnableAsync
public class PerformanceConfig {

    private static final Logger logger = LoggerFactory.getLogger(PerformanceConfig.class);

    // @Bean
    // public HttpExchangeRepository httpExchangeRepository() {
    //     // Keep track of last 100 HTTP exchanges for monitoring
    //     return new InMemoryHttpExchangeRepository();
    // }

    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("RecovR-Async-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }

    @Bean
    public OncePerRequestFilter performanceLoggingFilter() {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest request, 
                                          HttpServletResponse response, 
                                          FilterChain filterChain) throws ServletException, IOException {
                
                long startTime = System.currentTimeMillis();
                String method = request.getMethod();
                String uri = request.getRequestURI();
                String queryString = request.getQueryString();
                
                try {
                    filterChain.doFilter(request, response);
                } finally {
                    long duration = System.currentTimeMillis() - startTime;
                    int status = response.getStatus();
                    
                    // Log slow requests (> 2 seconds)
                    if (duration > 2000) {
                        logger.warn("Slow request: " + method + " " + uri + " - " + duration + "ms - Status: " + status);
                    } else if (duration > 1000) {
                        logger.info("Request: " + method + " " + uri + " - " + duration + "ms - Status: " + status);
                    }
                    
                    // Log error responses
                    if (status >= 400) {
                        logger.warn("Error response: " + method + " " + uri + " - Status: " + status + " - Duration: " + duration + "ms");
                    }
                }
            }

            @Override
            protected boolean shouldNotFilter(HttpServletRequest request) {
                String path = request.getRequestURI();
                
                // Skip logging for static resources and health checks
                return path.startsWith("/actuator/health") ||
                       path.startsWith("/static/") ||
                       path.startsWith("/css/") ||
                       path.startsWith("/js/") ||
                       path.startsWith("/images/") ||
                       path.endsWith(".ico") ||
                       path.endsWith(".png") ||
                       path.endsWith(".jpg") ||
                       path.endsWith(".gif");
            }
        };
    }
}