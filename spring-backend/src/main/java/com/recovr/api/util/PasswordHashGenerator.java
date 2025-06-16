package com.recovr.api.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        String password = "admin123";
        String hash = encoder.encode(password);
        
        System.out.println("=== BCrypt Hash Generator ===");
        System.out.println("Password: " + password);
        System.out.println("Hash: " + hash);
        
        // Verify the hash works
        boolean matches = encoder.matches(password, hash);
        System.out.println("Verification: " + matches);
        
        // Generate a few more for testing
        System.out.println("\n=== Additional hashes for 'admin123' ===");
        for (int i = 0; i < 3; i++) {
            String newHash = encoder.encode(password);
            System.out.println("Hash " + (i+1) + ": " + newHash);
        }
    }
}