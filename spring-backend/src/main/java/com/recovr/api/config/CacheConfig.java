package com.recovr.api.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import java.util.Arrays;

@Configuration
@EnableCaching
@EnableScheduling
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager();
        
        // Define cache names
        cacheManager.setCacheNames(Arrays.asList(
            "items",           // Item listings
            "itemDetails",     // Individual item details
            "searchResults",   // Search query results
            "userProfiles",    // User profile data
            "statistics",      // Dashboard statistics
            "detectionSessions", // Detection session data
            "categories"       // Item categories
        ));
        
        // Allow dynamic cache creation
        cacheManager.setAllowNullValues(false);
        
        return cacheManager;
    }

    /**
     * Clear caches periodically to prevent memory buildup
     * Runs every hour
     */
    @Scheduled(fixedRate = 3600000) // 1 hour
    public void clearCaches() {
        CacheManager cacheManager = cacheManager();
        
        // Clear search results cache (most volatile)
        if (cacheManager.getCache("searchResults") != null) {
            cacheManager.getCache("searchResults").clear();
        }
        
        // Clear statistics cache (updated frequently)
        if (cacheManager.getCache("statistics") != null) {
            cacheManager.getCache("statistics").clear();
        }
    }

    /**
     * Clear all caches - can be called when major data updates occur
     */
    public void evictAllCaches() {
        CacheManager cacheManager = cacheManager();
        cacheManager.getCacheNames().forEach(cacheName -> {
            if (cacheManager.getCache(cacheName) != null) {
                cacheManager.getCache(cacheName).clear();
            }
        });
    }
}