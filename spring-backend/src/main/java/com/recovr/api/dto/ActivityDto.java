package com.recovr.api.dto;

import java.time.LocalDateTime;

public class ActivityDto {
    private String type; // "REPORTED", "CLAIMED", "UPDATED", etc.
    private String description;
    private String itemName;
    private Long itemId;
    private LocalDateTime timestamp;

    public ActivityDto() {}

    public ActivityDto(String type, String description, String itemName, Long itemId, LocalDateTime timestamp) {
        this.type = type;
        this.description = description;
        this.itemName = itemName;
        this.itemId = itemId;
        this.timestamp = timestamp;
    }

    // Getters and setters
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }

    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}