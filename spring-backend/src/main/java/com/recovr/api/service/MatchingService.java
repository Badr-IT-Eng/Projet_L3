package com.recovr.api.service;

import com.recovr.api.dto.ItemDto;
import com.recovr.api.dto.MatchDto;
import com.recovr.api.entity.Item;
import com.recovr.api.entity.ItemStatus;
import com.recovr.api.entity.User;
import com.recovr.api.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MatchingService {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private ItemService itemService;

    // Configurable match threshold (default 0.4)
    private double matchThreshold = 0.4;
    public void setMatchThreshold(double threshold) {
        this.matchThreshold = threshold;
    }

    /**
     * Find potential matches for lost items based on found items
     */
    public List<MatchDto> findPotentialMatches(User user) {
        List<MatchDto> matches = new ArrayList<>();
        
        // Get user's lost items (items they're looking for)
        List<Item> lostItems = itemRepository.findByReportedBy(user).stream()
            .filter(item -> item.getStatus() == ItemStatus.LOST)
            .collect(Collectors.toList());
            
        // Get all found items (excluding user's own items)
        List<Item> foundItems = itemRepository.findAll().stream()
            .filter(item -> item.getStatus() == ItemStatus.FOUND)
            .filter(item -> !item.getReportedBy().equals(user))
            .collect(Collectors.toList());
        
        // Compare each lost item with each found item
        for (Item lostItem : lostItems) {
            for (Item foundItem : foundItems) {
                double matchScore = calculateMatchScore(lostItem, foundItem);
                if (matchScore >= matchThreshold) {
                    MatchDto match = createMatch(lostItem, foundItem, matchScore);
                    matches.add(match);
                }
            }
        }
        
        // Sort by match score descending
        matches.sort((a, b) -> Double.compare(b.getMatchScore(), a.getMatchScore()));
        
        return matches.stream().limit(10).collect(Collectors.toList()); // Return top 10 matches
    }

    /**
     * Find matches for a specific item
     */
    public List<MatchDto> findMatchesForItem(Long itemId) {
        Item item = itemRepository.findById(itemId).orElse(null);
        if (item == null) return new ArrayList<>();
        
        List<MatchDto> matches = new ArrayList<>();
        ItemStatus targetStatus = item.getStatus() == ItemStatus.LOST ? ItemStatus.FOUND : ItemStatus.LOST;
        
        List<Item> candidateItems = itemRepository.findAll().stream()
            .filter(i -> i.getStatus() == targetStatus)
            .filter(i -> !i.getReportedBy().equals(item.getReportedBy()))
            .collect(Collectors.toList());
        
        for (Item candidateItem : candidateItems) {
            double matchScore = calculateMatchScore(item, candidateItem);
            if (matchScore >= matchThreshold) {
                MatchDto match = item.getStatus() == ItemStatus.LOST ? 
                    createMatch(item, candidateItem, matchScore) :
                    createMatch(candidateItem, item, matchScore);
                matches.add(match);
            }
        }
        
        matches.sort((a, b) -> Double.compare(b.getMatchScore(), a.getMatchScore()));
        return matches.stream().limit(5).collect(Collectors.toList());
    }

    private MatchDto createMatch(Item lostItem, Item foundItem, double matchScore) {
        MatchDto match = new MatchDto(lostItem.getId(), foundItem.getId(), matchScore, generateMatchReason(lostItem, foundItem));
        match.setLostItem(itemService.convertToDto(lostItem));
        match.setFoundItem(itemService.convertToDto(foundItem));
        return match;
    }

    private double calculateMatchScore(Item item1, Item item2) {
        double score = 0.0;
        double maxScore = 1.0;

        // Category match (25% weight)
        if (item1.getCategory() != null && item1.getCategory().equals(item2.getCategory())) {
            score += 0.25;
        } else if (item1.getCategory() != null && item2.getCategory() != null && areCategoriesRelated(item1.getCategory().name(), item2.getCategory().name())) {
            score += 0.05;
        }

        // Name/title similarity (10% weight, max of Jaccard/Levenshtein)
        double nameSim = Math.max(
            calculateNameSimilarity(item1.getName(), item2.getName()),
            calculateLevenshteinSimilarity(item1.getName(), item2.getName())
        );
        score += 0.10 * nameSim;

        // Location proximity (25% weight)
        double locationSim = 0.0;
        if (item1.getLocation() != null && item2.getLocation() != null) {
            locationSim = calculateLocationSimilarity(item1.getLocation(), item2.getLocation());
        }
        score += 0.25 * locationSim;

        // Date proximity (15% weight)
        double dateSim = 0.0;
        if (item1.getCreatedAt() != null && item2.getCreatedAt() != null) {
            dateSim = calculateDateSimilarity(item1.getCreatedAt(), item2.getCreatedAt());
        }
        score += 0.15 * dateSim;

        // Description similarity (20% weight, max of Jaccard/Levenshtein)
        double descSim = Math.max(
            calculateJaccardSimilarity(item1.getDescription(), item2.getDescription()),
            calculateLevenshteinSimilarity(item1.getDescription(), item2.getDescription())
        );
        score += 0.20 * descSim;

        // Future: Add image similarity (if image features available)
        // Future: Add geo-matching (if latitude/longitude available)

        return Math.max(0.0, Math.min(score / maxScore, 1.0));
    }

    private double calculateLocationSimilarity(String loc1, String loc2) {
        if (loc1 == null || loc2 == null) return 0.0;
        
        String location1 = loc1.toLowerCase().trim();
        String location2 = loc2.toLowerCase().trim();
        
        // Exact match
        if (location1.equals(location2)) return 1.0;
        
        // Contains match
        if (location1.contains(location2) || location2.contains(location1)) return 0.8;
        
        // Word overlap
        String[] words1 = location1.split("\\s+");
        String[] words2 = location2.split("\\s+");
        
        int commonWords = 0;
        for (String word1 : words1) {
            for (String word2 : words2) {
                if (word1.equals(word2) && word1.length() > 2) { // Ignore short words
                    commonWords++;
                    break;
                }
            }
        }
        
        if (commonWords > 0) {
            return 0.4 + (0.4 * commonWords / Math.max(words1.length, words2.length));
        }
        
        return 0.0;
    }

    private double calculateDateSimilarity(LocalDateTime date1, LocalDateTime date2) {
        if (date1 == null || date2 == null) return 0.0;
        
        long daysDiff = Math.abs(ChronoUnit.DAYS.between(date1, date2));
        
        // Perfect match for same day
        if (daysDiff == 0) return 1.0;
        
        // Good match within 3 days
        if (daysDiff <= 3) return 0.8;
        
        // Decent match within a week
        if (daysDiff <= 7) return 0.6;
        
        // Fair match within 2 weeks
        if (daysDiff <= 14) return 0.4;
        
        // Poor match within a month
        if (daysDiff <= 30) return 0.2;
        
        return 0.0;
    }

    private double calculateDescriptionSimilarity(String desc1, String desc2) {
        if (desc1 == null || desc2 == null) return 0.0;
        
        String description1 = desc1.toLowerCase().trim();
        String description2 = desc2.toLowerCase().trim();
        
        // Simple word overlap calculation
        String[] words1 = description1.split("\\s+");
        String[] words2 = description2.split("\\s+");
        
        int commonWords = 0;
        for (String word1 : words1) {
            if (word1.length() > 2) { // Ignore short words
                for (String word2 : words2) {
                    if (word1.equals(word2)) {
                        commonWords++;
                        break;
                    }
                }
            }
        }
        
        if (commonWords == 0) return 0.0;
        
        return (double) commonWords / Math.max(words1.length, words2.length);
    }

    private String generateMatchReason(Item lostItem, Item foundItem) {
        List<String> reasons = new ArrayList<>();
        
        if (lostItem.getCategory() != null && lostItem.getCategory().equals(foundItem.getCategory())) {
            reasons.add("Même catégorie");
        }
        
        if (lostItem.getLocation() != null && foundItem.getLocation() != null) {
            double locationSim = calculateLocationSimilarity(lostItem.getLocation(), foundItem.getLocation());
            if (locationSim > 0.7) {
                reasons.add("Lieu similaire");
            }
        }
        
        if (lostItem.getCreatedAt() != null && foundItem.getCreatedAt() != null) {
            long daysDiff = Math.abs(ChronoUnit.DAYS.between(lostItem.getCreatedAt(), foundItem.getCreatedAt()));
            if (daysDiff <= 7) {
                reasons.add("Période similaire");
            }
        }
        
        if (lostItem.getDescription() != null && foundItem.getDescription() != null) {
            double descSim = calculateDescriptionSimilarity(lostItem.getDescription(), foundItem.getDescription());
            if (descSim > 0.3) {
                reasons.add("Description similaire");
            }
        }
        
        return reasons.isEmpty() ? "Correspondance potentielle" : String.join(", ", reasons);
    }

    // --- New/Improved Helper Methods ---
    private boolean areCategoriesRelated(String cat1, String cat2) {
        // Simple example: treat BAGS and BACKPACKS as related
        cat1 = cat1.toUpperCase();
        cat2 = cat2.toUpperCase();
        if ((cat1.contains("BAG") && cat2.contains("BAG")) || (cat1.contains("BOOK") && cat2.contains("BOOK"))) return true;
        // Add more logic as needed
        return false;
    }

    private double calculateNameSimilarity(String name1, String name2) {
        if (name1 == null || name2 == null) return 0.0;
        name1 = name1.toLowerCase().trim();
        name2 = name2.toLowerCase().trim();
        if (name1.equals(name2)) return 1.0;
        if (name1.contains(name2) || name2.contains(name1)) return 0.8;
        // Word overlap
        String[] words1 = name1.split("\\s+");
        String[] words2 = name2.split("\\s+");
        int common = 0;
        for (String w1 : words1) for (String w2 : words2) if (w1.equals(w2) && w1.length() > 2) common++;
        if (common > 0) return 0.5 + 0.5 * common / Math.max(words1.length, words2.length);
        return 0.0;
    }

    private double calculateJaccardSimilarity(String s1, String s2) {
        if (s1 == null || s2 == null) return 0.0;
        String[] set1 = s1.toLowerCase().split("\\W+");
        String[] set2 = s2.toLowerCase().split("\\W+");
        java.util.Set<String> union = new java.util.HashSet<>();
        java.util.Set<String> intersection = new java.util.HashSet<>();
        for (String w : set1) union.add(w);
        for (String w : set2) if (!union.add(w)) intersection.add(w);
        if (union.isEmpty()) return 0.0;
        return (double) intersection.size() / union.size();
    }

    private double calculateGeoLocationSimilarity(Double lat1, Double lon1, Double lat2, Double lon2) {
        // Haversine formula for distance in km
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        double distance = R * c;
        // Score: 1.0 if <1km, 0.8 if <5km, 0.5 if <20km, 0.2 if <100km, else 0
        if (distance < 1) return 1.0;
        if (distance < 5) return 0.8;
        if (distance < 20) return 0.5;
        if (distance < 100) return 0.2;
        return 0.0;
    }

    // Levenshtein similarity (normalized)
    private double calculateLevenshteinSimilarity(String s1, String s2) {
        if (s1 == null || s2 == null) return 0.0;
        s1 = s1.toLowerCase().trim();
        s2 = s2.toLowerCase().trim();
        int maxLen = Math.max(s1.length(), s2.length());
        if (maxLen == 0) return 1.0;
        int dist = levenshteinDistance(s1, s2);
        return 1.0 - ((double) dist / maxLen);
    }

    // Levenshtein distance implementation
    private int levenshteinDistance(String s1, String s2) {
        int[] costs = new int[s2.length() + 1];
        for (int j = 0; j < costs.length; j++) {
            costs[j] = j;
        }
        for (int i = 1; i <= s1.length(); i++) {
            costs[0] = i;
            int nw = i - 1;
            for (int j = 1; j <= s2.length(); j++) {
                int cj = Math.min(1 + Math.min(costs[j], costs[j - 1]), s1.charAt(i - 1) == s2.charAt(j - 1) ? nw : nw + 1);
                nw = costs[j];
                costs[j] = cj;
            }
        }
        return costs[s2.length()];
    }
}