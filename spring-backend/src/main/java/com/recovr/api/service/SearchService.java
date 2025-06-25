package com.recovr.api.service;

import com.recovr.api.dto.SearchRequestDto;
import com.recovr.api.dto.ImageMatchingDto;
import com.recovr.api.entity.*;
import com.recovr.api.repository.DetectedObjectRepository;
import com.recovr.api.repository.ItemRepository;
import com.recovr.api.repository.SearchRequestRepository;
import com.recovr.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchService {

    private final SearchRequestRepository searchRequestRepository;
    private final DetectedObjectRepository detectedObjectRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;

    /**
     * Create a new search request
     */
    @Transactional
    public SearchRequestDto createSearchRequest(SearchRequestDto requestDto, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SearchRequest request = new SearchRequest();
        request.setUser(user);
        request.setSearchImageUrl(requestDto.getSearchImageUrl());
        request.setDescription(requestDto.getDescription());
        request.setExpectedCategory(requestDto.getExpectedCategory());
        request.setMatchingThreshold(requestDto.getMatchingThreshold() != null ? 
            requestDto.getMatchingThreshold() : 0.7);
        request.setSearchLocation(requestDto.getSearchLocation());
        request.setSearchLatitude(requestDto.getSearchLatitude());
        request.setSearchLongitude(requestDto.getSearchLongitude());
        request.setSearchRadius(requestDto.getSearchRadius());
        request.setDateLostFrom(requestDto.getDateLostFrom());
        request.setDateLostTo(requestDto.getDateLostTo());
        request.setStatus(SearchStatus.PENDING);
        request.setTotalMatchesFound(0);

        SearchRequest savedRequest = searchRequestRepository.save(request);
        return convertToDto(savedRequest);
    }

    /**
     * Get search results for a request
     */
    @Transactional(readOnly = true)
    public SearchRequestDto getSearchResults(Long searchRequestId) {
        SearchRequest request = searchRequestRepository.findById(searchRequestId)
                .orElseThrow(() -> new RuntimeException("Search request not found"));

        if (request.getStatus() == SearchStatus.PENDING) {
            // Process the search request
            List<ImageMatching> matches = findMatchingItems(request);
            request.setMatchingResults(matches);
            request.setTotalMatchesFound(matches.size());
            request.setStatus(SearchStatus.COMPLETED);
            request.setProcessedAt(LocalDateTime.now());
            searchRequestRepository.save(request);
        }

        return convertToDto(request);
    }

    /**
     * Find items matching the search request
     */
    private List<ImageMatching> findMatchingItems(SearchRequest request) {
        // Get all detected objects within the time window
        List<DetectedObject> candidates = detectedObjectRepository.findByFirstDetectedBetween(
            request.getDateLostFrom() != null ? request.getDateLostFrom() : LocalDateTime.now().minusMonths(1),
            request.getDateLostTo() != null ? request.getDateLostTo() : LocalDateTime.now()
        );

        // Filter by category if specified
        if (request.getExpectedCategory() != null) {
            candidates = candidates.stream()
                .filter(obj -> obj.getCategory() == request.getExpectedCategory())
                .collect(Collectors.toList());
        }

        // Filtrage géographique par proximité si coordonnées spécifiées
        if (request.getSearchLocation() != null && request.getSearchLatitude() != null && 
            request.getSearchLongitude() != null && request.getSearchRadius() != null) {
            // Note technique: Extension future nécessitant enrichissement schema DetectedObject
            // avec coordonnées GPS pour calcul distance haversine
            log.info("Recherche géographique demandée - fonctionnalité en développement");
        }

        // Calculate similarity scores and create matches
        List<ImageMatching> matches = new ArrayList<>();
        for (DetectedObject candidate : candidates) {
            double similarityScore = calculateImageSimilarity(
                request.getSearchImageUrl(),
                candidate.getSnapshotUrl()
            );

            if (similarityScore >= request.getMatchingThreshold()) {
                ImageMatching match = new ImageMatching();
                match.setSearchRequest(request);
                match.setDetectedObject(candidate);
                match.setSimilarityScore(similarityScore);
                matches.add(match);
            }
        }

        // Sort by similarity score
        matches.sort((a, b) -> Double.compare(b.getSimilarityScore(), a.getSimilarityScore()));

        return matches;
    }

    /**
     * Calcul de similarité visuelle entre deux images
     * Implémentation basique pour démonstration - production nécessite intégration API vision artificielle
     */
    private double calculateImageSimilarity(String image1Url, String image2Url) {
        // Algorithme de similarité basique basé sur hash des URLs pour cohérence
        // Production: intégration service IA externe (TensorFlow, OpenCV, API Python)
        long hash1 = image1Url != null ? image1Url.hashCode() : 0;
        long hash2 = image2Url != null ? image2Url.hashCode() : 0;
        
        // Simulation score basé sur différence relative des hashes
        double normalizedDiff = Math.abs(hash1 - hash2) / (double) Integer.MAX_VALUE;
        return Math.max(0.1, 1.0 - normalizedDiff); // Score minimum 0.1 pour éviter zéros
    }

    /**
     * Convert entity to DTO
     */
    private SearchRequestDto convertToDto(SearchRequest request) {
        SearchRequestDto dto = new SearchRequestDto();
        dto.setId(request.getId());
        dto.setSearchImageUrl(request.getSearchImageUrl());
        dto.setDescription(request.getDescription());
        dto.setExpectedCategory(request.getExpectedCategory());
        dto.setMatchingThreshold(request.getMatchingThreshold());
        dto.setSearchLocation(request.getSearchLocation());
        dto.setSearchLatitude(request.getSearchLatitude());
        dto.setSearchLongitude(request.getSearchLongitude());
        dto.setSearchRadius(request.getSearchRadius());
        dto.setDateLostFrom(request.getDateLostFrom());
        dto.setDateLostTo(request.getDateLostTo());
        dto.setStatus(request.getStatus());
        dto.setTotalMatchesFound(request.getTotalMatchesFound());
        dto.setUserId(request.getUser().getId());
        dto.setUsername(request.getUser().getUsername());
        dto.setProcessedAt(request.getProcessedAt());
        dto.setCreatedAt(request.getCreatedAt());
        dto.setUpdatedAt(request.getUpdatedAt());

        // Convert matching results to DTOs
        if (request.getMatchingResults() != null) {
            List<ImageMatchingDto> matchingDtos = request.getMatchingResults().stream()
                .map(match -> {
                    ImageMatchingDto matchDto = new ImageMatchingDto();
                    matchDto.setDetectedObjectId(match.getDetectedObject().getId());
                    matchDto.setSimilarityScore(match.getSimilarityScore());
                    matchDto.setCategory(match.getDetectedObject().getCategory());
                    matchDto.setLocation(match.getDetectedObject().getCameraLocation());
                    matchDto.setDetectedAt(match.getDetectedObject().getFirstDetected());
                    matchDto.setImageUrl(match.getDetectedObject().getSnapshotUrl());
                    return matchDto;
                })
                .collect(Collectors.toList());
            dto.setMatchingResults(matchingDtos);
        }

        return dto;
    }
} 