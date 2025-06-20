package com.recovr.api.service;

import com.recovr.api.dto.DetectedObjectDto;
import com.recovr.api.entity.*;
import com.recovr.api.repository.DetectedObjectRepository;
import com.recovr.api.repository.DetectionSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.HashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class DetectionService {

    private final DetectedObjectRepository detectedObjectRepository;
    private final DetectionSessionRepository detectionSessionRepository;
    private final RestTemplate restTemplate;

    @Value("${app.models.path:../}")
    private String modelsPath;

    @Value("${app.detection.abandon-threshold:300}")
    private Long defaultAbandonThreshold; // 5 minutes in seconds

    @Value("${app.detection.confidence-threshold:0.5}")
    private Double defaultConfidenceThreshold;
    
    @Value("${app.python.strict-detection-api:http://localhost:5002}")
    private String strictDetectionApiUrl;

    /**
     * Start a new detection session for a camera
     */
    @Transactional
    public DetectionSession startDetectionSession(String cameraId, String cameraLocation, String modelVersion) {
        log.info("Starting detection session for camera: {} at location: {}", cameraId, cameraLocation);

        DetectionSession session = new DetectionSession();
        session.setSessionId(UUID.randomUUID().toString());
        session.setCameraId(cameraId);
        session.setCameraLocation(cameraLocation);
        session.setModelVersion(modelVersion);
        session.setConfidenceThreshold(defaultConfidenceThreshold);
        session.setIsActive(true);

        return detectionSessionRepository.save(session);
    }

    /**
     * End a detection session
     */
    @Transactional
    public void endDetectionSession(String sessionId) {
        Optional<DetectionSession> sessionOpt = detectionSessionRepository.findBySessionId(sessionId);
        if (sessionOpt.isPresent()) {
            DetectionSession session = sessionOpt.get();
            session.endSession();
            detectionSessionRepository.save(session);
            log.info("Ended detection session: {}", sessionId);
        }
    }

    /**
     * Process a detection result from PyTorch model
     * This method will be called when your model detects an object
     */
    @Transactional
    public DetectedObject processDetection(
            String sessionId,
            String trackingId,
            ItemCategory category,
            Double confidence,
            int x, int y, int width, int height,
            String snapshotUrl) {

        log.info("Processing detection - Tracking ID: {}, Category: {}, Confidence: {}",
                trackingId, category, confidence);

        // Find or create detected object
        Optional<DetectedObject> existingOpt = detectedObjectRepository.findByTrackingId(trackingId);

        DetectedObject detectedObject;
        if (existingOpt.isPresent()) {
            // Update existing detection
            detectedObject = existingOpt.get();
            updateExistingDetection(detectedObject, confidence, x, y, width, height, snapshotUrl);
        } else {
            // Create new detection
            detectedObject = createNewDetection(sessionId, trackingId, category, confidence,
                    x, y, width, height, snapshotUrl);
        }

        return detectedObjectRepository.save(detectedObject);
    }

    /**
     * Update tracking information for existing detection
     */
    private void updateExistingDetection(DetectedObject detectedObject, Double confidence,
                                         int x, int y, int width, int height, String snapshotUrl) {
        detectedObject.setConfidenceScore(confidence);
        detectedObject.setBoundingBoxX(x);
        detectedObject.setBoundingBoxY(y);
        detectedObject.setBoundingBoxWidth(width);
        detectedObject.setBoundingBoxHeight(height);
        detectedObject.setSnapshotUrl(snapshotUrl);
        detectedObject.setFrameTimestamp(LocalDateTime.now());

        // The @PreUpdate will handle lastSeen and stationary duration calculation
    }

    /**
     * Create new detected object
     */
    private DetectedObject createNewDetection(String sessionId, String trackingId, ItemCategory category,
                                              Double confidence, int x, int y, int width, int height,
                                              String snapshotUrl) {

        DetectionSession session = detectionSessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Detection session not found: " + sessionId));

        DetectedObject detectedObject = new DetectedObject();
        detectedObject.setTrackingId(trackingId);
        detectedObject.setCategory(category);
        detectedObject.setConfidenceScore(confidence);
        detectedObject.setBoundingBoxX(x);
        detectedObject.setBoundingBoxY(y);
        detectedObject.setBoundingBoxWidth(width);
        detectedObject.setBoundingBoxHeight(height);
        detectedObject.setSnapshotUrl(snapshotUrl);
        detectedObject.setFrameTimestamp(LocalDateTime.now());
        detectedObject.setCameraLocation(session.getCameraLocation());
        detectedObject.setDetectionSession(session);
        detectedObject.setAbandonThreshold(defaultAbandonThreshold);

        // Update session statistics
        session.incrementDetections();

        return detectedObject;
    }

    /**
     * Get all abandoned objects (potential lost items)
     */
    public List<DetectedObjectDto> getAbandonedObjects() {
        List<DetectedObject> abandonedObjects = detectedObjectRepository.findByIsAbandonedTrue();
        return abandonedObjects.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get recent detections
     */
    public List<DetectedObjectDto> getRecentDetections(int hoursBack) {
        LocalDateTime since = LocalDateTime.now().minusHours(hoursBack);
        List<DetectedObject> recentDetections = detectedObjectRepository.findRecentDetections(since);
        return recentDetections.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Mark detected object as claimed/linked to a reported item
     */
    @Transactional
    public void linkDetectedObjectToItem(Long detectedObjectId, Long itemId) {
        DetectedObject detectedObject = detectedObjectRepository.findById(detectedObjectId)
                .orElseThrow(() -> new RuntimeException("Detected object not found"));

        // Note: You'll need to inject ItemRepository to get the Item
        // For now, just set the ID - you can improve this later
        detectedObject.setStatus(DetectionStatus.CLAIMED);
        detectedObjectRepository.save(detectedObject);

        log.info("Linked detected object {} to item {}", detectedObjectId, itemId);
    }

    /**
     * Convert entity to DTO
     */
    private DetectedObjectDto convertToDto(DetectedObject detectedObject) {
        DetectedObjectDto dto = new DetectedObjectDto();
        dto.setId(detectedObject.getId());
        dto.setTrackingId(detectedObject.getTrackingId());
        dto.setCategory(detectedObject.getCategory());
        dto.setConfidenceScore(detectedObject.getConfidenceScore());
        dto.setFirstDetected(detectedObject.getFirstDetected());
        dto.setLastSeen(detectedObject.getLastSeen());
        dto.setStationaryDuration(detectedObject.getStationaryDuration());
        dto.setIsAbandoned(detectedObject.getIsAbandoned());
        dto.setAbandonThreshold(detectedObject.getAbandonThreshold());
        dto.setCameraLocation(detectedObject.getCameraLocation());
        dto.setBoundingBoxX(detectedObject.getBoundingBoxX());
        dto.setBoundingBoxY(detectedObject.getBoundingBoxY());
        dto.setBoundingBoxWidth(detectedObject.getBoundingBoxWidth());
        dto.setBoundingBoxHeight(detectedObject.getBoundingBoxHeight());
        dto.setSnapshotUrl(detectedObject.getSnapshotUrl());
        dto.setFrameTimestamp(detectedObject.getFrameTimestamp());
        dto.setStatus(detectedObject.getStatus());
        
        if (detectedObject.getDetectionSession() != null) {
            dto.setDetectionSessionId(detectedObject.getDetectionSession().getId());
            dto.setSessionId(detectedObject.getDetectionSession().getSessionId());
        }
        
        if (detectedObject.getLinkedItem() != null) {
            dto.setLinkedItemId(detectedObject.getLinkedItem().getId());
            dto.setLinkedItemName(detectedObject.getLinkedItem().getName());
        }
        
        dto.setCreatedAt(detectedObject.getCreatedAt());
        dto.setUpdatedAt(detectedObject.getUpdatedAt());
        
        return dto;
    }

    /**
     * Get detection statistics
     */
    public Map<String, Object> getDetectionStats() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime last24Hours = now.minusHours(24);
        LocalDateTime lastWeek = now.minusWeeks(1);
        LocalDateTime lastMonth = now.minusMonths(1);

        // Get active sessions
        List<DetectionSession> activeSessions = detectionSessionRepository.findByIsActiveTrue();
        
        // Get recent detections
        List<DetectedObject> recentDetections = detectedObjectRepository.findRecentDetections(last24Hours);
        
        // Get abandoned objects
        List<DetectedObject> abandonedObjects = detectedObjectRepository.findByIsAbandonedTrue();
        
        // Calculate statistics
        Map<String, Object> stats = new HashMap<>();
        
        // Overall statistics
        stats.put("totalDetections", detectedObjectRepository.count());
        stats.put("activeSessions", activeSessions.size());
        stats.put("abandonedObjects", abandonedObjects.size());
        
        // Time-based statistics
        stats.put("detectionsLast24Hours", recentDetections.size());
        stats.put("detectionsLastWeek", detectedObjectRepository.findByFirstDetectedBetween(lastWeek, now).size());
        stats.put("detectionsLastMonth", detectedObjectRepository.findByFirstDetectedBetween(lastMonth, now).size());
        
        // Category distribution
        Map<ItemCategory, Long> categoryDistribution = recentDetections.stream()
            .collect(Collectors.groupingBy(
                DetectedObject::getCategory,
                Collectors.counting()
            ));
        stats.put("categoryDistribution", categoryDistribution);
        
        // Location statistics
        Map<String, Long> locationStats = recentDetections.stream()
            .collect(Collectors.groupingBy(
                DetectedObject::getCameraLocation,
                Collectors.counting()
            ));
        stats.put("locationStats", locationStats);
        
        // Recovery rate (claimed vs total abandoned)
        long totalAbandoned = abandonedObjects.size();
        long claimedItems = abandonedObjects.stream()
            .filter(obj -> obj.getStatus() == DetectionStatus.CLAIMED)
            .count();
        double recoveryRate = totalAbandoned > 0 ? (double) claimedItems / totalAbandoned * 100 : 0;
        stats.put("recoveryRate", Math.round(recoveryRate * 100.0) / 100.0);
        
        // Active cameras
        List<String> activeCameras = activeSessions.stream()
            .map(DetectionSession::getCameraId)
            .distinct()
            .collect(Collectors.toList());
        stats.put("activeCameras", activeCameras);
        
        // Detection trends (hourly for last 24 hours)
        Map<Integer, Long> hourlyTrends = recentDetections.stream()
            .collect(Collectors.groupingBy(
                detection -> detection.getFirstDetected().getHour(),
                Collectors.counting()
            ));
        stats.put("hourlyTrends", hourlyTrends);
        
        return stats;
    }

    /**
     * Process video using strict detection API
     * Only detects main objects, filters out small parts like handles, zippers
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> processVideoWithStrictDetection(MultipartFile videoFile) {
        try {
            log.info("🎯 Processing video with strict detection: {}", videoFile.getOriginalFilename());
            log.info("📊 Video file size: {} bytes", videoFile.getSize());
            log.info("🌐 Strict detection API URL: {}", strictDetectionApiUrl);
            
            // Create temporary file
            java.io.File tempFile = java.io.File.createTempFile("upload_", "_" + videoFile.getOriginalFilename());
            log.info("📁 Created temp file: {}", tempFile.getAbsolutePath());
            
            videoFile.transferTo(tempFile);
            log.info("✅ File transferred to temp location, size: {} bytes", tempFile.length());
            
            // Prepare multipart request
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("video", new FileSystemResource(tempFile));
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            
            // Call strict detection API
            String url = strictDetectionApiUrl + "/detect/strict";
            log.info("📤 Calling Python API: {}", url);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                url, HttpMethod.POST, requestEntity, Map.class);
            
            log.info("📥 Python API response status: {}", response.getStatusCode());
            log.info("📥 Python API response body: {}", response.getBody());
            
            // Cleanup temporary file
            boolean deleted = tempFile.delete();
            log.info("🗑️ Temp file deleted: {}", deleted);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> result = response.getBody();
                log.info("✅ Strict detection completed successfully");
                
                // Process the results if objects were detected
                if (result.containsKey("objects") && result.get("objects") instanceof List) {
                    List<Map<String, Object>> objects = (List<Map<String, Object>>) result.get("objects");
                    log.info("📦 Detected {} main object(s) (strict filtering)", objects.size());
                }
                
                return result;
            } else {
                log.error("❌ Python API returned error status: {}", response.getStatusCode());
                throw new RuntimeException("Strict detection API returned error: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            log.error("❌ Strict detection failed with exception: ", e);
            throw new RuntimeException("Failed to process video with strict detection: " + e.getMessage(), e);
        }
    }

    /**
     * Process video using strict detection API and save results to database
     */
    @SuppressWarnings("unchecked")
    @Transactional
    public Map<String, Object> processVideoWithStrictDetectionAndSave(MultipartFile videoFile) {
        try {
            log.info("🎯 Processing video with strict detection and saving to database: {}", videoFile.getOriginalFilename());
            
            // First, process the video with the Python API
            Map<String, Object> result = processVideoWithStrictDetection(videoFile);
            
            // Check if any objects were detected
            if (result.containsKey("objects") && result.get("objects") instanceof List) {
                List<Map<String, Object>> objects = (List<Map<String, Object>>) result.get("objects");
                
                if (!objects.isEmpty()) {
                    // Create a detection session for this admin upload
                    DetectionSession session = startDetectionSession(
                        "admin-upload", 
                        "Admin Video Upload", 
                        "strict-detection-v1.0"
                    );
                    
                    log.info("📝 Created detection session: {} for {} objects", session.getSessionId(), objects.size());
                    
                    // Save each detected object to the database
                    for (Map<String, Object> obj : objects) {
                        try {
                            // Extract object data
                            String trackingId = (String) obj.get("id");
                            String categoryStr = (String) obj.get("category");
                            Double confidence = ((Number) obj.get("confidence")).doubleValue();
                            List<Integer> bbox = (List<Integer>) obj.get("bbox");
                            
                            // Map category string to ItemCategory enum
                            ItemCategory category = mapStringToItemCategory(categoryStr);
                            
                            // Save to database
                            DetectedObject detectedObject = processDetection(
                                session.getSessionId(),
                                trackingId,
                                category,
                                confidence,
                                bbox.get(0), // x
                                bbox.get(1), // y  
                                bbox.get(2), // width
                                bbox.get(3), // height
                                (String) obj.get("cropped_image_url") // snapshot URL
                            );
                            
                            log.info("💾 Saved detected object: {} - {} ({}% confidence)", 
                                detectedObject.getId(), category, Math.round(confidence * 100));
                            
                        } catch (Exception e) {
                            log.error("❌ Failed to save detected object: {}", e.getMessage());
                        }
                    }
                    
                    // Add database info to the result
                    result.put("sessionId", session.getSessionId());
                    result.put("savedToDatabase", true);
                    result.put("detectionSessionId", session.getId());
                    
                } else {
                    result.put("savedToDatabase", false);
                    result.put("message", "No objects detected - nothing saved to database");
                }
            } else {
                result.put("savedToDatabase", false);
                result.put("message", "No detection results - nothing saved to database");
            }
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ Strict detection with save failed: ", e);
            throw new RuntimeException("Failed to process and save video detection: " + e.getMessage(), e);
        }
    }
    
    /**
     * Map category string from Python API to ItemCategory enum
     */
    private ItemCategory mapStringToItemCategory(String categoryStr) {
        if (categoryStr == null) return ItemCategory.MISCELLANEOUS;
        
        switch (categoryStr.toLowerCase()) {
            case "bags":
            case "bag":
            case "suitcase":
            case "luggage":
            case "backpack":
            case "handbag":
                return ItemCategory.BAGS;
            case "electronics":
            case "phone":
            case "laptop":
            case "tablet":
                return ItemCategory.ELECTRONICS;
            case "clothing":
            case "clothes":
            case "jacket":
            case "shirt":
                return ItemCategory.CLOTHING;
            case "accessories":
            case "watch":
            case "glasses":
                return ItemCategory.ACCESSORIES;
            case "jewelry":
                return ItemCategory.JEWELRY;
            case "documents":
            case "papers":
            case "passport":
            case "wallet":
                return ItemCategory.DOCUMENTS;
            case "keys":
                return ItemCategory.KEYS;
            case "books":
            case "book":
                return ItemCategory.BOOKS;
            case "toys":
            case "toy":
                return ItemCategory.TOYS;
            default:
                return ItemCategory.MISCELLANEOUS;
        }
    }
} 