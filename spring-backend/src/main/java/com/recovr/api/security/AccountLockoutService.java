package com.recovr.api.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service to handle account lockout functionality for preventing brute force attacks
 */
@Service
public class AccountLockoutService {

    private static final Logger logger = LoggerFactory.getLogger(AccountLockoutService.class);

    // Configuration constants
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCKOUT_DURATION_MINUTES = 15;
    private static final int ATTEMPT_WINDOW_MINUTES = 60; // Window to count failed attempts

    // In-memory storage for failed attempts and lockouts
    // In production, this should be stored in Redis or database
    private final Map<String, FailedAttemptInfo> failedAttempts = new ConcurrentHashMap<>();
    private final Map<String, LockoutInfo> lockedAccounts = new ConcurrentHashMap<>();

    /**
     * Records a failed login attempt for the given identifier
     */
    public void recordFailedAttempt(String identifier) {
        String key = normalizeIdentifier(identifier);
        LocalDateTime now = LocalDateTime.now();
        
        FailedAttemptInfo attemptInfo = failedAttempts.computeIfAbsent(key, 
            k -> new FailedAttemptInfo());
        
        // Clean old attempts outside the window
        attemptInfo.getAttemptTimes().removeIf(time -> 
            ChronoUnit.MINUTES.between(time, now) > ATTEMPT_WINDOW_MINUTES);
        
        // Add new attempt
        attemptInfo.getAttemptTimes().add(now);
        attemptInfo.setLastAttempt(now);
        
        logger.warn("Failed login attempt for identifier: {} (Total attempts in window: {})", 
                   key, attemptInfo.getAttemptTimes().size());
        
        // Check if account should be locked
        if (attemptInfo.getAttemptTimes().size() >= MAX_FAILED_ATTEMPTS) {
            lockAccount(key, now);
        }
    }

    /**
     * Records a successful login and clears failed attempts
     */
    public void recordSuccessfulLogin(String identifier) {
        String key = normalizeIdentifier(identifier);
        failedAttempts.remove(key);
        lockedAccounts.remove(key);
        
        logger.info("Successful login for identifier: {} - cleared failed attempts", key);
    }

    /**
     * Checks if the account is currently locked
     */
    public boolean isAccountLocked(String identifier) {
        String key = normalizeIdentifier(identifier);
        LockoutInfo lockoutInfo = lockedAccounts.get(key);
        
        if (lockoutInfo == null) {
            return false;
        }
        
        LocalDateTime now = LocalDateTime.now();
        long minutesLocked = ChronoUnit.MINUTES.between(lockoutInfo.getLockTime(), now);
        
        if (minutesLocked >= LOCKOUT_DURATION_MINUTES) {
            // Lockout period has expired, remove the lock
            lockedAccounts.remove(key);
            failedAttempts.remove(key);
            logger.info("Account lockout expired for identifier: {}", key);
            return false;
        }
        
        return true;
    }

    /**
     * Gets the remaining lockout time in minutes
     */
    public long getRemainingLockoutTime(String identifier) {
        String key = normalizeIdentifier(identifier);
        LockoutInfo lockoutInfo = lockedAccounts.get(key);
        
        if (lockoutInfo == null) {
            return 0;
        }
        
        LocalDateTime now = LocalDateTime.now();
        long minutesLocked = ChronoUnit.MINUTES.between(lockoutInfo.getLockTime(), now);
        
        return Math.max(0, LOCKOUT_DURATION_MINUTES - minutesLocked);
    }

    /**
     * Gets the number of failed attempts for an identifier
     */
    public int getFailedAttemptCount(String identifier) {
        String key = normalizeIdentifier(identifier);
        FailedAttemptInfo attemptInfo = failedAttempts.get(key);
        
        if (attemptInfo == null) {
            return 0;
        }
        
        LocalDateTime now = LocalDateTime.now();
        
        // Clean old attempts and return current count
        attemptInfo.getAttemptTimes().removeIf(time -> 
            ChronoUnit.MINUTES.between(time, now) > ATTEMPT_WINDOW_MINUTES);
        
        return attemptInfo.getAttemptTimes().size();
    }

    /**
     * Manually unlock an account (admin function)
     */
    public void unlockAccount(String identifier) {
        String key = normalizeIdentifier(identifier);
        lockedAccounts.remove(key);
        failedAttempts.remove(key);
        
        logger.info("Account manually unlocked for identifier: {}", key);
    }

    /**
     * Get lockout info for monitoring/admin purposes
     */
    public LockoutStatus getLockoutStatus(String identifier) {
        String key = normalizeIdentifier(identifier);
        
        boolean isLocked = isAccountLocked(key);
        int failedAttempts = getFailedAttemptCount(key);
        long remainingTime = getRemainingLockoutTime(key);
        
        return new LockoutStatus(isLocked, failedAttempts, remainingTime, MAX_FAILED_ATTEMPTS);
    }

    /**
     * Locks the account
     */
    private void lockAccount(String identifier, LocalDateTime lockTime) {
        LockoutInfo lockoutInfo = new LockoutInfo(lockTime);
        lockedAccounts.put(identifier, lockoutInfo);
        
        logger.warn("Account locked for identifier: {} due to {} failed attempts. " +
                   "Lockout duration: {} minutes", 
                   identifier, MAX_FAILED_ATTEMPTS, LOCKOUT_DURATION_MINUTES);
    }

    /**
     * Normalizes identifier (email/username) for consistent key storage
     */
    private String normalizeIdentifier(String identifier) {
        return identifier != null ? identifier.toLowerCase().trim() : "";
    }

    // Inner classes for data storage
    private static class FailedAttemptInfo {
        private final java.util.List<LocalDateTime> attemptTimes = new java.util.ArrayList<>();
        private LocalDateTime lastAttempt;

        public java.util.List<LocalDateTime> getAttemptTimes() { return attemptTimes; }
        public LocalDateTime getLastAttempt() { return lastAttempt; }
        public void setLastAttempt(LocalDateTime lastAttempt) { this.lastAttempt = lastAttempt; }
    }

    private static class LockoutInfo {
        private final LocalDateTime lockTime;

        public LockoutInfo(LocalDateTime lockTime) {
            this.lockTime = lockTime;
        }

        public LocalDateTime getLockTime() { return lockTime; }
    }

    public static class LockoutStatus {
        private final boolean locked;
        private final int failedAttempts;
        private final long remainingLockoutMinutes;
        private final int maxAllowedAttempts;

        public LockoutStatus(boolean locked, int failedAttempts, long remainingLockoutMinutes, int maxAllowedAttempts) {
            this.locked = locked;
            this.failedAttempts = failedAttempts;
            this.remainingLockoutMinutes = remainingLockoutMinutes;
            this.maxAllowedAttempts = maxAllowedAttempts;
        }

        public boolean isLocked() { return locked; }
        public int getFailedAttempts() { return failedAttempts; }
        public long getRemainingLockoutMinutes() { return remainingLockoutMinutes; }
        public int getMaxAllowedAttempts() { return maxAllowedAttempts; }
        public int getRemainingAttempts() { return Math.max(0, maxAllowedAttempts - failedAttempts); }
    }
}