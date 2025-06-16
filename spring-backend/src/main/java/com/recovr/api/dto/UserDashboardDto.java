package com.recovr.api.dto;

import java.util.List;
import java.util.ArrayList;

public class UserDashboardDto {
    private long totalReportedItems;
    private long totalClaimedItems;
    private long totalLostItems;
    private long totalFoundItems;
    private double successRate;
    private List<ItemDto> recentItems;
    private List<ItemDto> claimedItems;
    private List<ItemDto> lostItems;
    private List<ActivityDto> recentActivity;

    public UserDashboardDto() {
        this.recentItems = new ArrayList<>();
        this.claimedItems = new ArrayList<>();
        this.lostItems = new ArrayList<>();
        this.recentActivity = new ArrayList<>();
    }

    // Getters and setters
    public long getTotalReportedItems() { return totalReportedItems; }
    public void setTotalReportedItems(long totalReportedItems) { this.totalReportedItems = totalReportedItems; }

    public long getTotalClaimedItems() { return totalClaimedItems; }
    public void setTotalClaimedItems(long totalClaimedItems) { this.totalClaimedItems = totalClaimedItems; }

    public long getTotalLostItems() { return totalLostItems; }
    public void setTotalLostItems(long totalLostItems) { this.totalLostItems = totalLostItems; }

    public long getTotalFoundItems() { return totalFoundItems; }
    public void setTotalFoundItems(long totalFoundItems) { this.totalFoundItems = totalFoundItems; }

    public double getSuccessRate() { return successRate; }
    public void setSuccessRate(double successRate) { this.successRate = successRate; }

    public List<ItemDto> getRecentItems() { return recentItems; }
    public void setRecentItems(List<ItemDto> recentItems) { this.recentItems = recentItems; }

    public List<ItemDto> getClaimedItems() { return claimedItems; }
    public void setClaimedItems(List<ItemDto> claimedItems) { this.claimedItems = claimedItems; }

    public List<ItemDto> getLostItems() { return lostItems; }
    public void setLostItems(List<ItemDto> lostItems) { this.lostItems = lostItems; }

    public List<ActivityDto> getRecentActivity() { return recentActivity; }
    public void setRecentActivity(List<ActivityDto> recentActivity) { this.recentActivity = recentActivity; }
}