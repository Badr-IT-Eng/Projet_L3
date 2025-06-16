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
                if (matchScore >= 0.4) { // Only include matches with at least 40% similarity
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
            if (matchScore >= 0.4) {
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
        double maxScore = 0.0;
        
        // Category match (30% weight)
        maxScore += 0.3;
        if (item1.getCategory() != null && item1.getCategory().equals(item2.getCategory())) {
            score += 0.3;
        }
        
        // Location proximity (25% weight)
        maxScore += 0.25;
        if (item1.getLocation() != null && item2.getLocation() != null) {
            double locationSimilarity = calculateLocationSimilarity(item1.getLocation(), item2.getLocation());
            score += 0.25 * locationSimilarity;
        }
        
        // Date proximity (20% weight) - items should be reported within reasonable time frame
        maxScore += 0.2;
        if (item1.getCreatedAt() != null && item2.getCreatedAt() != null) {
            double dateSimilarity = calculateDateSimilarity(item1.getCreatedAt(), item2.getCreatedAt());
            score += 0.2 * dateSimilarity;
        }
        
        // Description similarity (25% weight)
        maxScore += 0.25;
        if (item1.getDescription() != null && item2.getDescription() != null) {
            double descriptionSimilarity = calculateDescriptionSimilarity(item1.getDescription(), item2.getDescription());
            score += 0.25 * descriptionSimilarity;
        }
        
        return maxScore > 0 ? score / maxScore : 0.0;
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
}