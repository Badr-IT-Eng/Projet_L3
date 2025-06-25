package com.recovr.api.controller;

import com.recovr.api.dto.ItemDto;
import com.recovr.api.entity.Item;
import com.recovr.api.entity.User;
import com.recovr.api.exception.ResourceNotFoundException;
import com.recovr.api.repository.UserRepository;
import com.recovr.api.security.services.UserDetailsImpl;
import com.recovr.api.service.ItemService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/items")
public class ItemController {
    private static final Logger log = LoggerFactory.getLogger(ItemController.class);

    @Autowired
    private ItemService itemService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getAllItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        try {
            Pageable paging = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<ItemDto> pageItems = itemService.getAllItems(paging, category, status, location, dateFrom, dateTo);

            Map<String, Object> response = new HashMap<>();
            response.put("items", pageItems.getContent());
            response.put("currentPage", pageItems.getNumber());
            response.put("totalItems", pageItems.getTotalElements());
            response.put("totalPages", pageItems.getTotalPages());

            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getItemById(@PathVariable Long id) {
        try {
            ItemDto item = itemService.getItemById(id);
            return new ResponseEntity<>(item, HttpStatus.OK);
        } catch (ResourceNotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping
    public ResponseEntity<?> createItem(@Valid @RequestBody ItemDto itemDto) {
        log.info("Received POST /api/items request body: {}", itemDto);
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User user = null;
            if (authentication != null && authentication.isAuthenticated() && !(authentication.getPrincipal() instanceof String)) {
                UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
                user = userRepository.findById(userDetails.getId())
                        .orElse(null);
            }
            if (user == null) {
                log.info("Creating item anonymously (no authenticated user)");
            }
            ItemDto createdItem = itemService.createItem(itemDto, user);
            return new ResponseEntity<>(createdItem, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("Error in createItem: ", e);
            log.error("Error details: {}", e.toString());
            log.error("Stack trace: ", e);
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateItem(
            @PathVariable Long id,
            @Valid @RequestBody ItemDto itemDto) {
        try {
            ItemDto updatedItem = itemService.updateItem(id, itemDto);
            return new ResponseEntity<>(updatedItem, HttpStatus.OK);
        } catch (ResourceNotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteItem(@PathVariable Long id) {
        try {
            itemService.deleteItem(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (ResourceNotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/{id}/claim")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> claimItem(@PathVariable Long id) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            
            User user = userRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            
            ItemDto claimedItem = itemService.claimItem(id, user);
            return new ResponseEntity<>(claimedItem, HttpStatus.OK);
        } catch (ResourceNotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (IllegalStateException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/public/lost")
    public ResponseEntity<?> getPublicLostItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String query) {
        try {
            Pageable paging = PageRequest.of(page, size, Sort.by("createdAt").descending());
            
            // Enhanced search with query parameter
            Page<ItemDto> pageItems = itemService.searchItems(paging, category, "LOST", location, dateFrom, dateTo, query);

            Map<String, Object> response = new HashMap<>();
            response.put("items", pageItems.getContent());
            response.put("currentPage", pageItems.getNumber());
            response.put("totalItems", pageItems.getTotalElements());
            response.put("totalPages", pageItems.getTotalPages());

            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error in getPublicLostItems: ", e);
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/search")
    public ResponseEntity<?> searchItems(@RequestBody Map<String, Object> searchRequest) {
        try {
            log.info("Received search request: {}", searchRequest);
            
            String searchType = (String) searchRequest.get("searchType");
            if (!"details".equals(searchType)) {
                return new ResponseEntity<>("Only 'details' search type is supported", HttpStatus.BAD_REQUEST);
            }

            // Extract search parameters
            String description = (String) searchRequest.get("description");
            String location = (String) searchRequest.get("location");
            String dateFrom = (String) searchRequest.get("dateFrom");
            String dateTo = (String) searchRequest.get("dateTo");
            String category = (String) searchRequest.get("category");

            // Default pagination
            Pageable paging = PageRequest.of(0, 50, Sort.by("createdAt").descending());
            
            // Use enhanced search
            Page<ItemDto> pageItems = itemService.searchItems(paging, category, "LOST", location, dateFrom, dateTo, description);
            
            // Transform results to match frontend expectations
            List<Map<String, Object>> results = pageItems.getContent().stream()
                .map(item -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("id", item.getId());
                    result.put("name", item.getName() != null ? item.getName() : "Unnamed Item");
                    result.put("location", item.getLocation() != null ? item.getLocation() : "Unknown Location");
                    result.put("date", item.getCreatedAt() != null ? item.getCreatedAt().toLocalDate().toString() : "");
                    result.put("description", item.getDescription() != null ? item.getDescription() : "No description available");
                    result.put("category", item.getCategory() != null ? item.getCategory().toString().toLowerCase() : "other");
                    result.put("status", item.getStatus() != null ? item.getStatus().toString().toLowerCase() : "lost");
                    
                    // Handle image URL
                    String imageUrl = "/placeholder.svg?height=200&width=200";
                    if (item.getImageUrl() != null && !item.getImageUrl().equals("test.jpg")) {
                        if (item.getImageUrl().startsWith("http")) {
                            imageUrl = item.getImageUrl();
                        } else if (item.getImageUrl().startsWith("/")) {
                            imageUrl = "http://localhost:8082" + item.getImageUrl();
                        } else {
                            imageUrl = "http://localhost:8082/api/files/" + item.getImageUrl();
                        }
                    }
                    result.put("image", imageUrl);
                    
                    // Calculate match score based on query relevance
                    double matchScore = calculateMatchScore(item, description, location);
                    result.put("matchScore", (int) Math.round(matchScore));
                    
                    return result;
                })
                .filter(result -> {
                    Object score = result.get("matchScore");
                    return score instanceof Number && ((Number) score).intValue() >= 10;
                })
                .sorted((a, b) -> {
                    Object scoreA = a.get("matchScore");
                    Object scoreB = b.get("matchScore");
                    int intA = scoreA instanceof Number ? ((Number) scoreA).intValue() : 0;
                    int intB = scoreB instanceof Number ? ((Number) scoreB).intValue() : 0;
                    return Integer.compare(intB, intA);
                })
                .collect(Collectors.toList());

            // Determine search quality
            String searchQuality = "no_matches";
            if (!results.isEmpty()) {
                Object scoreObj = results.get(0).get("matchScore");
                int topScore = scoreObj instanceof Number ? ((Number) scoreObj).intValue() : 0;
                if (topScore > 80) searchQuality = "excellent";
                else if (topScore > 60) searchQuality = "high";
                else if (topScore > 40) searchQuality = "medium";
                else searchQuality = "low";
            }

            Map<String, Object> response = new HashMap<>();
            response.put("results", results);
            response.put("totalMatches", results.size());
            response.put("searchQuality", searchQuality);
            
            return new ResponseEntity<>(response, HttpStatus.OK);
            
        } catch (Exception e) {
            log.error("Error in searchItems: ", e);
            return new ResponseEntity<>("Search failed: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private double calculateMatchScore(ItemDto item, String description, String location) {
        try {
            double score = 0;
            
            if (description != null && !description.isEmpty()) {
                String desc = description.toLowerCase();
                String itemName = item.getName() != null ? item.getName().toLowerCase() : "";
                String itemDesc = item.getDescription() != null ? item.getDescription().toLowerCase() : "";
                
                // Exact name match
                if (itemName.equals(desc)) {
                    score += 40;
                } else if (itemName.contains(desc) || desc.contains(itemName)) {
                    score += 30;
                } else {
                    // Word matching
                    String[] queryWords = desc.split("\\s+");
                    for (String word : queryWords) {
                        if (word.length() > 2) {
                            if (itemName.contains(word)) score += 15;
                            if (itemDesc.contains(word)) score += 10;
                        }
                    }
                }
            }
            
            if (location != null && !location.isEmpty()) {
                String loc = location.toLowerCase();
                String itemLoc = item.getLocation() != null ? item.getLocation().toLowerCase() : "";
                
                if (itemLoc.contains(loc) || loc.contains(itemLoc)) {
                    score += 20;
                }
            }
            
            // Base relevance score
            score += 10;
            
            return Math.min(score, 100);
        } catch (Exception e) {
            log.error("Error calculating match score: ", e);
            return 10; // Return minimum score
        }
    }
} 