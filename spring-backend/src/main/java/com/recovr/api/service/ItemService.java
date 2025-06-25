package com.recovr.api.service;

import com.recovr.api.dto.ItemDto;
import com.recovr.api.entity.Item;
import com.recovr.api.entity.ItemCategory;
import com.recovr.api.entity.ItemStatus;
import com.recovr.api.entity.User;
import com.recovr.api.exception.ResourceNotFoundException;
import com.recovr.api.repository.ItemRepository;
import com.recovr.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class ItemService {
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private static final Logger log = LoggerFactory.getLogger(ItemService.class);

    public Page<ItemDto> getAllItems(Pageable pageable, String category, String status, String location, String dateFrom, String dateTo) {
        return searchItems(pageable, category, status, location, dateFrom, dateTo, null);
    }

    public Page<ItemDto> searchItems(Pageable pageable, String category, String status, String location, String dateFrom, String dateTo, String query) {
        log.info("Searching items with - category: {}, status: {}, location: {}, dateFrom: {}, dateTo: {}, query: {}", 
                category, status, location, dateFrom, dateTo, query);
        
        Specification<Item> spec = Specification.where(null);
        
        if (category != null && !category.isEmpty() && !"all".equalsIgnoreCase(category)) {
            try {
                final ItemCategory categoryEnum = ItemCategory.valueOf(category.toUpperCase());
                spec = spec.and((root, querySpec, cb) -> cb.equal(root.get("category"), categoryEnum));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid category: {}", category);
            }
        }
        
        if (status != null && !status.isEmpty()) {
            try {
                final ItemStatus statusEnum = ItemStatus.valueOf(status.toUpperCase());
                spec = spec.and((root, querySpec, cb) -> cb.equal(root.get("status"), statusEnum));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid status: {}", status);
            }
        }
        
        if (location != null && !location.isEmpty()) {
            final String locationLower = location.toLowerCase();
            spec = spec.and((root, querySpec, cb) -> 
                cb.like(cb.lower(root.get("location")), "%" + locationLower + "%"));
        }
        
        // Enhanced text search across name and description
        if (query != null && !query.trim().isEmpty()) {
            final String searchTerm = query.trim().toLowerCase();
            spec = spec.and((root, querySpec, cb) -> {
                String[] words = searchTerm.split("\\s+");
                var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
                
                // Search in name and description for each word
                for (String word : words) {
                    if (word.length() > 1) {
                        var nameMatch = cb.like(cb.lower(root.get("name")), "%" + word + "%");
                        var descMatch = cb.like(cb.lower(root.get("description")), "%" + word + "%");
                        predicates.add(cb.or(nameMatch, descMatch));
                    }
                }
                
                return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
            });
        }
        
        if (dateFrom != null && !dateFrom.isEmpty()) {
            try {
                LocalDate startDate = LocalDate.parse(dateFrom, DateTimeFormatter.ISO_LOCAL_DATE);
                LocalDateTime startDateTime = startDate.atStartOfDay();
                spec = spec.and((root, querySpec, cb) -> 
                    cb.greaterThanOrEqualTo(root.get("createdAt"), startDateTime));
            } catch (Exception e) {
                log.warn("Invalid dateFrom format: {}", dateFrom);
            }
        }
        
        if (dateTo != null && !dateTo.isEmpty()) {
            try {
                LocalDate endDate = LocalDate.parse(dateTo, DateTimeFormatter.ISO_LOCAL_DATE);
                LocalDateTime endDateTime = endDate.atTime(23, 59, 59);
                spec = spec.and((root, querySpec, cb) -> 
                    cb.lessThanOrEqualTo(root.get("createdAt"), endDateTime));
            } catch (Exception e) {
                log.warn("Invalid dateTo format: {}", dateTo);
            }
        }
        
        Page<ItemDto> result = itemRepository.findAll(spec, pageable).map(this::convertToDto);
        log.info("Search returned {} items", result.getTotalElements());
        return result;
    }

    public ItemDto getItemById(Long id) {
        Item item = itemRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));
        return convertToDto(item);
    }

    @Transactional
    public ItemDto createItem(ItemDto itemDto, User user) {
        log.info("Creating item: name={}, status={}, category={}, imageUrl={}", 
            itemDto.getName(), itemDto.getStatus(), itemDto.getCategory(), itemDto.getImageUrl());
        
        Item item = new Item();
        updateItemFromDto(item, itemDto);
        if (user != null) {
            item.setReportedBy(user);
            item.setReportedAt(LocalDateTime.now());
        }
        // Use the status from the DTO instead of forcing it to FOUND
        // This allows both LOST and FOUND items to be created correctly
        if (item.getStatus() == null) {
            item.setStatus(ItemStatus.FOUND); // Default fallback
        }
        Item savedItem = itemRepository.save(item);
        
        log.info("Successfully created item ID {} with status: {}", savedItem.getId(), savedItem.getStatus());
        return convertToDto(savedItem);
    }

    @Transactional
    public ItemDto updateItem(Long id, ItemDto itemDto) {
        Item item = itemRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));
        updateItemFromDto(item, itemDto);
        return convertToDto(itemRepository.save(item));
    }

    @Transactional
    public void deleteItem(Long id) {
        if (!itemRepository.existsById(id)) {
            throw new RuntimeException("Item not found");
        }
        itemRepository.deleteById(id);
    }

    @Transactional
    public ItemDto claimItem(Long id, User user) {
        Item item = itemRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Item not found"));

        if (item.getStatus() != ItemStatus.FOUND) {
            throw new RuntimeException("Item cannot be claimed");
        }

        item.setStatus(ItemStatus.CLAIMED);
        item.setClaimedBy(user);
        item.setClaimedAt(LocalDateTime.now());
        item.setUpdatedAt(LocalDateTime.now());

        Item updatedItem = itemRepository.save(item);
        return convertToDto(updatedItem);
    }

    public void updateItemFromDto(Item item, ItemDto dto) {
        log.info("updateItemFromDto received ItemDto: {}", dto);
        try {
            item.setName(dto.getName());
            item.setDescription(dto.getDescription());
            item.setCategory(dto.getCategory());
            item.setStatus(dto.getStatus());
            item.setLocation(dto.getLocation());
            item.setImageUrl(dto.getImageUrl());
            item.setContactPhone(dto.getContactPhone());
            item.setContactEmail(dto.getContactEmail());
            item.setLatitude(dto.getLatitude());
            item.setLongitude(dto.getLongitude());
        } catch (Exception e) {
            log.error("Error in updateItemFromDto: ", e);
            throw e;
        }
    }

    protected ItemDto convertToDto(Item item) {
        ItemDto dto = new ItemDto();
        dto.setId(item.getId());
        dto.setName(item.getName());
        dto.setDescription(item.getDescription());
        dto.setCategory(item.getCategory());
        dto.setStatus(item.getStatus());
        dto.setLocation(item.getLocation());
        dto.setImageUrl(item.getImageUrl());
        
        if (item.getReportedBy() != null) {
            dto.setReportedById(item.getReportedBy().getId());
            dto.setReportedByUsername(item.getReportedBy().getUsername());
            dto.setReportedAt(item.getReportedAt());
        }
        
        if (item.getClaimedBy() != null) {
            dto.setClaimedById(item.getClaimedBy().getId());
            dto.setClaimedByUsername(item.getClaimedBy().getUsername());
            dto.setClaimedAt(item.getClaimedAt());
        }
        
        dto.setCreatedAt(item.getCreatedAt());
        dto.setUpdatedAt(item.getUpdatedAt());
        dto.setContactPhone(item.getContactPhone());
        dto.setContactEmail(item.getContactEmail());
        dto.setLatitude(item.getLatitude());
        dto.setLongitude(item.getLongitude());
        
        return dto;
    }
} 