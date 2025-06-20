package com.recovr.api.security;

import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Enhanced password policy service with comprehensive validation
 */
@Service
public class PasswordPolicyService {

    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 128;
    
    // Regex patterns for password validation
    private static final Pattern LOWERCASE = Pattern.compile(".*[a-z].*");
    private static final Pattern UPPERCASE = Pattern.compile(".*[A-Z].*");
    private static final Pattern DIGIT = Pattern.compile(".*[0-9].*");
    private static final Pattern SPECIAL_CHAR = Pattern.compile(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*");
    
    // Common weak passwords to reject
    private static final List<String> COMMON_PASSWORDS = List.of(
        "password", "123456", "123456789", "qwerty", "abc123", "password123",
        "admin", "letmein", "welcome", "monkey", "1234567890", "password1",
        "123123", "12345678", "qwerty123", "1q2w3e4r", "admin123"
    );

    /**
     * Validates password against comprehensive security policy
     */
    public PasswordValidationResult validatePassword(String password) {
        List<String> errors = new ArrayList<>();
        
        if (password == null || password.trim().isEmpty()) {
            errors.add("Password is required");
            return new PasswordValidationResult(false, errors, 0);
        }
        
        // Length validation
        if (password.length() < MIN_LENGTH) {
            errors.add("Password must be at least " + MIN_LENGTH + " characters long");
        }
        
        if (password.length() > MAX_LENGTH) {
            errors.add("Password must not exceed " + MAX_LENGTH + " characters");
        }
        
        // Character type validation
        if (!LOWERCASE.matcher(password).matches()) {
            errors.add("Password must contain at least one lowercase letter");
        }
        
        if (!UPPERCASE.matcher(password).matches()) {
            errors.add("Password must contain at least one uppercase letter");
        }
        
        if (!DIGIT.matcher(password).matches()) {
            errors.add("Password must contain at least one digit");
        }
        
        if (!SPECIAL_CHAR.matcher(password).matches()) {
            errors.add("Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;':\"\\,.<>?/)");
        }
        
        // Common password check
        if (COMMON_PASSWORDS.contains(password.toLowerCase())) {
            errors.add("Password is too common. Please choose a more secure password");
        }
        
        // Sequential character check
        if (hasSequentialCharacters(password)) {
            errors.add("Password should not contain sequential characters (e.g., 123, abc)");
        }
        
        // Repeated character check
        if (hasRepeatedCharacters(password)) {
            errors.add("Password should not contain more than 2 consecutive identical characters");
        }
        
        // Calculate password strength
        int strength = calculatePasswordStrength(password);
        
        boolean isValid = errors.isEmpty();
        return new PasswordValidationResult(isValid, errors, strength);
    }

    /**
     * Calculates password strength score (0-100)
     */
    private int calculatePasswordStrength(String password) {
        int score = 0;
        
        // Length score (up to 25 points)
        if (password.length() >= 8) score += 10;
        if (password.length() >= 12) score += 10;
        if (password.length() >= 16) score += 5;
        
        // Character variety score (up to 40 points)
        if (LOWERCASE.matcher(password).matches()) score += 10;
        if (UPPERCASE.matcher(password).matches()) score += 10;
        if (DIGIT.matcher(password).matches()) score += 10;
        if (SPECIAL_CHAR.matcher(password).matches()) score += 10;
        
        // Complexity score (up to 35 points)
        long uniqueChars = password.chars().distinct().count();
        score += Math.min(15, (int)(uniqueChars * 1.5)); // Unique character variety
        
        if (!hasSequentialCharacters(password)) score += 10;
        if (!hasRepeatedCharacters(password)) score += 10;
        
        return Math.min(100, score);
    }

    /**
     * Checks for sequential characters (123, abc, etc.)
     */
    private boolean hasSequentialCharacters(String password) {
        for (int i = 0; i < password.length() - 2; i++) {
            char c1 = password.charAt(i);
            char c2 = password.charAt(i + 1);
            char c3 = password.charAt(i + 2);
            
            if (c2 == c1 + 1 && c3 == c2 + 1) {
                return true; // Found ascending sequence
            }
            if (c2 == c1 - 1 && c3 == c2 - 1) {
                return true; // Found descending sequence
            }
        }
        return false;
    }

    /**
     * Checks for repeated characters (aaa, 111, etc.)
     */
    private boolean hasRepeatedCharacters(String password) {
        for (int i = 0; i < password.length() - 2; i++) {
            if (password.charAt(i) == password.charAt(i + 1) && 
                password.charAt(i + 1) == password.charAt(i + 2)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns user-friendly strength description
     */
    public String getStrengthDescription(int strength) {
        if (strength < 30) return "Weak";
        if (strength < 50) return "Fair";
        if (strength < 70) return "Good";
        if (strength < 85) return "Strong";
        return "Very Strong";
    }

    /**
     * Password validation result container
     */
    public static class PasswordValidationResult {
        private final boolean valid;
        private final List<String> errors;
        private final int strength;

        public PasswordValidationResult(boolean valid, List<String> errors, int strength) {
            this.valid = valid;
            this.errors = errors;
            this.strength = strength;
        }

        public boolean isValid() { return valid; }
        public List<String> getErrors() { return errors; }
        public int getStrength() { return strength; }
    }
}