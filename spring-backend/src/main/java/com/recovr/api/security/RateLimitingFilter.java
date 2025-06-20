package com.recovr.api.security;

import io.github.bucket4j.*;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiting filter to prevent brute force attacks and excessive API usage
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitingFilter.class);
    
    // Rate limits for different endpoint types
    private static final int AUTH_REQUESTS_PER_MINUTE = 5;  // Login/register attempts
    private static final int API_REQUESTS_PER_MINUTE = 60;   // General API requests
    private static final int PUBLIC_REQUESTS_PER_MINUTE = 100; // Public endpoints
    
    private final Map<String, Bucket> authBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> apiBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> publicBuckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        
        String clientIp = getClientIpAddress(request);
        String requestURI = request.getRequestURI();
        
        // Determine rate limit type based on endpoint
        Bucket bucket;
        String limitType;
        
        if (requestURI.startsWith("/api/auth/")) {
            bucket = authBuckets.computeIfAbsent(clientIp, this::createAuthBucket);
            limitType = "AUTH";
        } else if (requestURI.startsWith("/api/admin/") || requestURI.startsWith("/api/detection/")) {
            bucket = apiBuckets.computeIfAbsent(clientIp, this::createApiBucket);
            limitType = "API";
        } else {
            bucket = publicBuckets.computeIfAbsent(clientIp, this::createPublicBucket);
            limitType = "PUBLIC";
        }
        
        if (bucket.tryConsume(1)) {
            // Request allowed
            filterChain.doFilter(request, response);
        } else {
            // Rate limit exceeded
            logger.warn("Rate limit exceeded for IP: {} on {} endpoint: {}", clientIp, limitType, requestURI);
            
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write(
                "{\"error\":\"Rate limit exceeded\",\"message\":\"Too many requests. Please try again later.\",\"type\":\"" + limitType + "\"}"
            );
        }
    }

    private Bucket createAuthBucket(String key) {
        // Strict rate limiting for authentication endpoints
        Bandwidth limit = Bandwidth.classic(AUTH_REQUESTS_PER_MINUTE, Refill.intervally(AUTH_REQUESTS_PER_MINUTE, Duration.ofMinutes(1)));
        return Bucket.builder()
            .addLimit(limit)
            .build();
    }

    private Bucket createApiBucket(String key) {
        // Moderate rate limiting for authenticated API endpoints
        Bandwidth limit = Bandwidth.classic(API_REQUESTS_PER_MINUTE, Refill.intervally(API_REQUESTS_PER_MINUTE, Duration.ofMinutes(1)));
        return Bucket.builder()
            .addLimit(limit)
            .build();
    }

    private Bucket createPublicBucket(String key) {
        // More lenient rate limiting for public endpoints
        Bandwidth limit = Bandwidth.classic(PUBLIC_REQUESTS_PER_MINUTE, Refill.intervally(PUBLIC_REQUESTS_PER_MINUTE, Duration.ofMinutes(1)));
        return Bucket.builder()
            .addLimit(limit)
            .build();
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedForHeader = request.getHeader("X-Forwarded-For");
        if (xForwardedForHeader == null) {
            return request.getRemoteAddr();
        } else {
            // X-Forwarded-For can contain multiple IPs, take the first one
            return xForwardedForHeader.split(",")[0].trim();
        }
    }
}