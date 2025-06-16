package com.recovr.api.controller;

import com.recovr.api.dto.MatchDto;
import com.recovr.api.entity.User;
import com.recovr.api.repository.UserRepository;
import com.recovr.api.security.services.UserDetailsImpl;
import com.recovr.api.service.MatchingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matching")
public class MatchingController {

    @Autowired
    private MatchingService matchingService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/suggestions")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getMatchingSuggestions() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            
            User user = userRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            List<MatchDto> matches = matchingService.findPotentialMatches(user);
            return new ResponseEntity<>(matches, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error finding matches: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/item/{itemId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getMatchesForItem(@PathVariable Long itemId) {
        try {
            List<MatchDto> matches = matchingService.findMatchesForItem(itemId);
            return new ResponseEntity<>(matches, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Error finding matches for item: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}