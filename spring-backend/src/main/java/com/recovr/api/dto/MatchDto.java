package com.recovr.api.dto;

public class MatchDto {
    private Long lostItemId;
    private Long foundItemId;
    private ItemDto lostItem;
    private ItemDto foundItem;
    private double matchScore;
    private String matchReason;
    private String confidence;

    public MatchDto() {}

    public MatchDto(Long lostItemId, Long foundItemId, double matchScore, String matchReason) {
        this.lostItemId = lostItemId;
        this.foundItemId = foundItemId;
        this.matchScore = matchScore;
        this.matchReason = matchReason;
        this.confidence = getConfidenceLevel(matchScore);
    }

    private String getConfidenceLevel(double score) {
        if (score >= 0.8) return "HIGH";
        if (score >= 0.6) return "MEDIUM";
        return "LOW";
    }

    // Getters and setters
    public Long getLostItemId() { return lostItemId; }
    public void setLostItemId(Long lostItemId) { this.lostItemId = lostItemId; }

    public Long getFoundItemId() { return foundItemId; }
    public void setFoundItemId(Long foundItemId) { this.foundItemId = foundItemId; }

    public ItemDto getLostItem() { return lostItem; }
    public void setLostItem(ItemDto lostItem) { this.lostItem = lostItem; }

    public ItemDto getFoundItem() { return foundItem; }
    public void setFoundItem(ItemDto foundItem) { this.foundItem = foundItem; }

    public double getMatchScore() { return matchScore; }
    public void setMatchScore(double matchScore) { 
        this.matchScore = matchScore;
        this.confidence = getConfidenceLevel(matchScore);
    }

    public String getMatchReason() { return matchReason; }
    public void setMatchReason(String matchReason) { this.matchReason = matchReason; }

    public String getConfidence() { return confidence; }
    public void setConfidence(String confidence) { this.confidence = confidence; }
}