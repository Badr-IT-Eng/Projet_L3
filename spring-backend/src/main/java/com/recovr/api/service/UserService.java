package com.recovr.api.service;

import com.recovr.api.dto.ActivityDto;
import com.recovr.api.dto.ItemDto;
import com.recovr.api.dto.UserDashboardDto;
import com.recovr.api.entity.Item;
import com.recovr.api.entity.ItemStatus;
import com.recovr.api.entity.User;
import com.recovr.api.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private ItemService itemService;

    @Transactional(readOnly = true)
    public UserDashboardDto getUserDashboard(User user) {
        UserDashboardDto dashboard = new UserDashboardDto();
        
        // Get all items reported by user
        List<Item> reportedItems = itemRepository.findByReportedBy(user);
        dashboard.setTotalReportedItems(reportedItems.size());
        
        // Count by status
        long foundItems = reportedItems.stream()
            .filter(item -> item.getStatus() == ItemStatus.FOUND)
            .count();
        dashboard.setTotalFoundItems(foundItems);
        
        // Get claimed items
        List<Item> claimedItems = itemRepository.findByClaimedBy(user);
        dashboard.setTotalClaimedItems(claimedItems.size());
        dashboard.setClaimedItems(
            claimedItems.stream()
                .limit(5)
                .map(itemService::convertToDto)
                .collect(Collectors.toList())
        );
        
        // Calculate success rate (items that were claimed out of total reported)
        long claimedFromReported = reportedItems.stream()
            .filter(item -> item.getClaimedBy() != null)
            .count();
        
        double successRate = reportedItems.isEmpty() ? 0.0 : 
            ((double) claimedFromReported / reportedItems.size()) * 100;
        dashboard.setSuccessRate(Math.round(successRate * 100.0) / 100.0);
        
        // Get recent items (latest 5 reported by user)
        List<Item> recentItems = itemRepository.findByReportedByOrderByCreatedAtDesc(
            user, PageRequest.of(0, 5)
        );
        dashboard.setRecentItems(
            recentItems.stream()
                .map(itemService::convertToDto)
                .collect(Collectors.toList())
        );
        
        // Generate recent activity
        dashboard.setRecentActivity(generateRecentActivity(user));
        
        return dashboard;
    }
    
    private List<ActivityDto> generateRecentActivity(User user) {
        List<ActivityDto> activities = new java.util.ArrayList<>();
        
        // Get recent reported items
        List<Item> recentReported = itemRepository.findByReportedByOrderByCreatedAtDesc(
            user, PageRequest.of(0, 3)
        );
        
        for (Item item : recentReported) {
            activities.add(new ActivityDto(
                "REPORTED",
                "You reported a found item",
                item.getName(),
                item.getId(),
                item.getCreatedAt()
            ));
        }
        
        // Get recent claimed items
        List<Item> recentClaimed = itemRepository.findByClaimedByOrderByClaimedAtDesc(
            user, PageRequest.of(0, 3)
        );
        
        for (Item item : recentClaimed) {
            activities.add(new ActivityDto(
                "CLAIMED",
                "You claimed an item",
                item.getName(),
                item.getId(),
                item.getClaimedAt()
            ));
        }
        
        // Sort by timestamp descending and limit to 5
        return activities.stream()
            .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
            .limit(5)
            .collect(Collectors.toList());
    }
}