package com.recovr.api.controller;

import com.recovr.api.entity.ERole;
import com.recovr.api.entity.Role;
import com.recovr.api.entity.User;
import com.recovr.api.repository.RoleRepository;
import com.recovr.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

//@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/test")
public class TestController {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RoleRepository roleRepository;

    @GetMapping("/ping")
    public ResponseEntity<?> ping() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "RECOVR API is running!");
        response.put("timestamp", System.currentTimeMillis());
        response.put("status", "UP");
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/filetest/{filename}")
    public ResponseEntity<?> testFileAccess(@PathVariable String filename) {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "File access test");
        response.put("filename", filename);
        response.put("accessible", true);
        
        return ResponseEntity.ok(response);
    }
    
} 