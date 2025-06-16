package com.recovr.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

//@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/test")
public class TestController {

    @GetMapping("/ping")
    public ResponseEntity<?> ping() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "RECOVR API is running!");
        response.put("timestamp", System.currentTimeMillis());
        response.put("status", "UP");
        
        return ResponseEntity.ok(response);
    }
} 