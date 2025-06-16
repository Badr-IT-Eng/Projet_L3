package com.recovr.api.dto;

import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;

public class AdminDashboardDto {
    private long totalItems;
    private long totalUsers;
    private Map<String, Long> itemsByStatus;
    private Map<String, Long> itemsByCategory;
    private long totalAbandoned;
    private long totalClaimed;
    private long totalReturned;
    private List<ItemDto> recentItems;
    private List<UserDto> recentUsers;

    public AdminDashboardDto() {
         this.itemsByStatus = new HashMap<>();
         this.itemsByCategory = new HashMap<>();
         this.recentItems = new ArrayList<>();
         this.recentUsers = new ArrayList<>();
    }

    public long getTotalItems() { return totalItems; }
    public void setTotalItems(long totalItems) { this.totalItems = totalItems; }

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }

    public Map<String, Long> getItemsByStatus() { return itemsByStatus; }
    public void setItemsByStatus(Map<String, Long> itemsByStatus) { this.itemsByStatus = itemsByStatus; }

    public Map<String, Long> getItemsByCategory() { return itemsByCategory; }
    public void setItemsByCategory(Map<String, Long> itemsByCategory) { this.itemsByCategory = itemsByCategory; }

    public long getTotalAbandoned() { return totalAbandoned; }
    public void setTotalAbandoned(long totalAbandoned) { this.totalAbandoned = totalAbandoned; }

    public long getTotalClaimed() { return totalClaimed; }
    public void setTotalClaimed(long totalClaimed) { this.totalClaimed = totalClaimed; }

    public long getTotalReturned() { return totalReturned; }
    public void setTotalReturned(long totalReturned) { this.totalReturned = totalReturned; }

    public List<ItemDto> getRecentItems() { return recentItems; }
    public void setRecentItems(List<ItemDto> recentItems) { this.recentItems = recentItems; }

    public List<UserDto> getRecentUsers() { return recentUsers; }
    public void setRecentUsers(List<UserDto> recentUsers) { this.recentUsers = recentUsers; }

} 