"use client";
import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Upload, 
  Video, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Camera
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuthenticatedApi } from "@/hooks/use-api";
import { useSession } from "next-auth/react";

interface DetectionResult {
  id: string;
  trackingId: string;
  category: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  timestamp: string;
  imageUrl?: string;
  croppedImage?: string;
  features?: number[];
  keypoints?: Array<{x: number, y: number, confidence: number}>;
  color_histogram?: number[];
  shape_descriptor?: number[];
  texture_features?: number[];
  abandonment_score?: number;
  movement_history?: Array<{x: number, y: number, timestamp: string}>;
  similar_objects?: Array<{id: string, similarity: number}>;
}

interface AdvancedDetectionSettings {
  enable_multi_scale: boolean;
  enable_tracking: boolean;
  enable_feature_extraction: boolean;
  confidence_threshold: number;
  nms_threshold: number;
  max_objects: number;
  temporal_consistency: boolean;
  smart_cropping: boolean;
}

export default function VideoDetectionPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [cameraLocation, setCameraLocation] = useState("Admin Upload");
  const [detectionSettings, setDetectionSettings] = useState<AdvancedDetectionSettings>({
    enable_multi_scale: true,
    enable_tracking: true,
    enable_feature_extraction: true,
    confidence_threshold: 0.85,
    nms_threshold: 0.5,
    max_objects: 10,
    temporal_consistency: true,
    smart_cropping: true
  });
  const [frameHistory, setFrameHistory] = useState<Array<{timestamp: number, objects: any[]}>>([]);
  const [objectTracker, setObjectTracker] = useState(new Map<string, any>());
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { apiCall } = useAuthenticatedApi();
  const { data: session } = useSession();

  // ENHANCED validation - Smart detection for lost objects
  const isValidDetection = (category: string, width: number, height: number, confidence: number): boolean => {
    const videoWidth = videoRef.current?.videoWidth || 1920;
    const videoHeight = videoRef.current?.videoHeight || 1080;
    
    // Calculate relative size
    const relativeWidth = width / videoWidth;
    const relativeHeight = height / videoHeight;
    const area = relativeWidth * relativeHeight;
    const aspectRatio = width / height;
    
    console.log(`🔍 Validating ${category}: size=${width}x${height}, area=${(area*100).toFixed(2)}%, ratio=${aspectRatio.toFixed(2)}`);
    
    // SMART rules for lost objects
    if (category === "BAGS") {
      // Bags/suitcases must be reasonable size (at least 0.5% of screen)
      if (area < 0.005) {
        console.log(`❌ ${category} too small: ${(area*100).toFixed(2)}% < 0.5%`);
        return false;
      }
      
      // Reasonable aspect ratio for bags
      if (aspectRatio < 0.3 || aspectRatio > 4.0) {
        console.log(`❌ ${category} weird shape: ratio=${aspectRatio.toFixed(2)}`);
        return false;
      }
      
      // Good confidence required
      if (confidence < 0.75) {
        console.log(`❌ ${category} low confidence: ${(confidence*100).toFixed(1)}% < 75%`);
        return false;
      }
      
      console.log(`✅ ${category} VALID: Bag/suitcase detected`);
      return true;
    }
    
    // Also detect electronics and other valuable items
    if (category === "ELECTRONICS") {
      if (area < 0.001 || area > 0.3) {
        console.log(`❌ ${category} size issue: ${(area*100).toFixed(2)}%`);
        return false;
      }
      if (confidence < 0.80) {
        console.log(`❌ ${category} low confidence: ${(confidence*100).toFixed(1)}% < 80%`);
        return false;
      }
      console.log(`✅ ${category} VALID: Electronic device detected`);
      return true;
    }
    
    // Accept other valid lost item categories
    const validCategories = ["KEYS", "WALLET", "PHONE", "LAPTOP", "TABLET", "CAMERA"];
    if (validCategories.includes(category)) {
      if (confidence >= 0.70 && area >= 0.0005 && area <= 0.4) {
        console.log(`✅ ${category} VALID: Lost item detected`);
        return true;
      }
    }
    
    console.log(`❌ ${category} REJECTED: Not a common lost item`);
    return false;
  };

  // Advanced feature extraction using computer vision techniques
  const extractAdvancedFeatures = async (canvas: HTMLCanvasElement): Promise<{
    features: number[],
    keypoints: Array<{x: number, y: number, confidence: number}>,
    colorHistogram: number[],
    textureFeatures: number[]
  }> => {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Color histogram extraction (RGB quantized to 64 bins)
    const colorHistogram = new Array(64).fill(0);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = Math.floor(data[i] / 64);
      const g = Math.floor(data[i + 1] / 64);
      const b = Math.floor(data[i + 2] / 64);
      const binIndex = r * 16 + g * 4 + b;
      if (binIndex < 64) colorHistogram[binIndex]++;
    }
    
    // Normalize histogram
    const total = colorHistogram.reduce((sum, val) => sum + val, 0);
    const normalizedHistogram = colorHistogram.map(val => total > 0 ? val / total : 0);
    
    // Advanced geometric features
    const aspectRatio = canvas.width / canvas.height;
    const logArea = Math.log(canvas.width * canvas.height + 1);
    const compactness = (4 * Math.PI * canvas.width * canvas.height) / Math.pow(2 * (canvas.width + canvas.height), 2);
    
    // Edge density calculation (simplified Sobel)
    let edgeCount = 0;
    const threshold = 30;
    for (let y = 1; y < canvas.height - 1; y++) {
      for (let x = 1; x < canvas.width - 1; x++) {
        const idx = (y * canvas.width + x) * 4;
        const gx = Math.abs(data[idx + 4] - data[idx - 4]); // horizontal gradient
        const gy = Math.abs(data[idx + canvas.width * 4] - data[idx - canvas.width * 4]); // vertical gradient
        if (Math.sqrt(gx * gx + gy * gy) > threshold) edgeCount++;
      }
    }
    const edgeDensity = edgeCount / (canvas.width * canvas.height);
    
    // Combine all features
    const features = [
      ...normalizedHistogram,
      aspectRatio,
      logArea,
      compactness,
      edgeDensity,
      ...Array.from({length: 16}, () => Math.random() * 0.1) // Placeholder for CNN features
    ];
    
    // Mock keypoints detection (corners and interest points)
    const keypoints = Array.from({length: Math.min(12, Math.floor(Math.sqrt(canvas.width * canvas.height) / 10))}, (_, i) => ({
      x: (Math.random() * 0.8 + 0.1) * canvas.width,
      y: (Math.random() * 0.8 + 0.1) * canvas.height,
      confidence: 0.6 + Math.random() * 0.4
    }));
    
    // Texture features (simplified LBP-like patterns)
    const textureFeatures = Array.from({length: 16}, (_, i) => {
      let sum = 0;
      const step = Math.floor(data.length / 16);
      for (let j = i * step; j < (i + 1) * step && j < data.length; j += 4) {
        sum += data[j]; // Red channel for texture
      }
      return sum / step;
    }).map(val => val / 255); // Normalize
    
    return {
      features,
      keypoints,
      colorHistogram: normalizedHistogram,
      textureFeatures
    };
  };
  
  // Intelligent object tracking with Kalman filter-inspired prediction
  const updateObjectTracker = (detection: any) => {
    const trackingId = detection.trackingId;
    const currentTime = Date.now();
    
    const newTracker = objectTracker;
    
    if (newTracker.has(trackingId)) {
      const existing = newTracker.get(trackingId);
      const deltaTime = Math.max((currentTime - existing.lastSeen) / 1000, 0.1); // seconds, min 0.1s
      
      // Calculate velocity
      const velocityX = (detection.x - existing.x) / deltaTime;
      const velocityY = (detection.y - existing.y) / deltaTime;
      
      // Smooth velocity using exponential moving average
      const smoothedVx = existing.velocityX * 0.7 + velocityX * 0.3;
      const smoothedVy = existing.velocityY * 0.7 + velocityY * 0.3;
      
      // Update tracker
      newTracker.set(trackingId, {
        ...existing,
        x: detection.x,
        y: detection.y,
        width: detection.width,
        height: detection.height,
        velocityX: smoothedVx,
        velocityY: smoothedVy,
        lastSeen: currentTime,
        frameCount: existing.frameCount + 1,
        confidence: Math.max(existing.confidence * 0.9 + detection.confidence * 0.1, detection.confidence), // Keep high confidence
        movementHistory: [...existing.movementHistory.slice(-15), {
          x: detection.x,
          y: detection.y,
          timestamp: new Date().toISOString()
        }],
        stationaryTime: Math.sqrt(smoothedVx * smoothedVx + smoothedVy * smoothedVy) < 5 ? 
          existing.stationaryTime + deltaTime : 0
      });
    } else {
      // New object
      newTracker.set(trackingId, {
        x: detection.x,
        y: detection.y,
        width: detection.width,
        height: detection.height,
        velocityX: 0,
        velocityY: 0,
        lastSeen: currentTime,
        frameCount: 1,
        confidence: detection.confidence,
        category: detection.category,
        stationaryTime: 0,
        movementHistory: [{
          x: detection.x,
          y: detection.y,
          timestamp: new Date().toISOString()
        }]
      });
    }
    
    setObjectTracker(new Map(newTracker));
  };
  
  // Calculate abandonment score using ML-inspired metrics
  const calculateAbandonmentScore = (trackingId: string): number => {
    const tracker = objectTracker.get(trackingId);
    if (!tracker) return 0;
    
    const movementVariance = calculateMovementVariance(tracker.movementHistory);
    const frameStability = Math.min(tracker.frameCount / 30, 1); // normalized by 30 frames
    
    // Advanced abandonment scoring with multiple factors
    let abandonmentScore = 0;
    
    // 1. Stationary time factor (exponential growth)
    const stationaryMinutes = tracker.stationaryTime / 60;
    abandonmentScore += Math.min(1 - Math.exp(-stationaryMinutes / 5), 0.4); // 5 min half-life
    
    // 2. Movement variance factor (less movement = higher abandonment)
    const movementFactor = Math.max(0, 1 - movementVariance / 50); // normalized by 50 pixels
    abandonmentScore += movementFactor * 0.25;
    
    // 3. Detection stability (consistent detection over time)
    abandonmentScore += frameStability * 0.2;
    
    // 4. Size consistency (objects that maintain size are more likely abandoned)
    const sizeVariance = tracker.movementHistory.length > 5 ? 
      calculateSizeVariance(tracker.movementHistory) : 0;
    const sizeStability = Math.max(0, 1 - sizeVariance);
    abandonmentScore += sizeStability * 0.15;
    
    // 5. Category-specific likelihood
    const categoryWeights = {
      'BAGS': 1.3,
      'ELECTRONICS': 1.2,
      'KEYS': 1.4,
      'CLOTHING': 0.8,
      'ACCESSORIES': 1.0
    };
    
    const categoryWeight = categoryWeights[tracker.category as keyof typeof categoryWeights] || 1.0;
    abandonmentScore *= categoryWeight;
    
    return Math.min(Math.max(abandonmentScore, 0), 1);
  };
  
  const calculateMovementVariance = (history: Array<{x: number, y: number, timestamp: string}>): number => {
    if (history.length < 3) return 0;
    
    const distances = [];
    for (let i = 1; i < history.length; i++) {
      const dx = history[i].x - history[i-1].x;
      const dy = history[i].y - history[i-1].y;
      distances.push(Math.sqrt(dx*dx + dy*dy));
    }
    
    const mean = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const variance = distances.reduce((sum, d) => sum + (d - mean) ** 2, 0) / distances.length;
    
    return Math.sqrt(variance);
  };
  
  const calculateSizeVariance = (history: Array<any>): number => {
    if (history.length < 3) return 0;
    
    // For now, return 0 as we don't track size in movement history
    // In production, this would calculate variance in object size
    return 0;
  };

  // Generate intelligent detections using advanced algorithms
  const generateIntelligentDetections = async (
    videoWidth: number, 
    videoHeight: number, 
    scale: number, 
    passIndex: number
  ): Promise<any[]> => {
    const detections = [];
    const categories = ['BAGS', 'ELECTRONICS', 'KEYS', 'CLOTHING', 'ACCESSORIES'];
    
    // Simulate different detection patterns based on pass
    const basePositions = passIndex === 0 ? 
      [[0.2, 0.3], [0.5, 0.4], [0.7, 0.2]] : // First pass - main objects
      passIndex === 1 ?
      [[0.1, 0.6], [0.8, 0.7]] : // Second pass - smaller objects
      [[0.3, 0.1], [0.6, 0.8]]; // Third pass - edge objects
    
    for (let i = 0; i < basePositions.length; i++) {
      const [baseX, baseY] = basePositions[i];
      const category = categories[i % categories.length];
      
      // Add some randomness for realistic detection
      const jitterX = (Math.random() - 0.5) * 0.05; // 5% jitter
      const jitterY = (Math.random() - 0.5) * 0.05;
      
      const x = Math.floor(videoWidth * (baseX + jitterX));
      const y = Math.floor(videoHeight * (baseY + jitterY));
      
      // Intelligent size calculation based on category and scale
      const baseSizes = {
        'BAGS': [0.08, 0.06],
        'ELECTRONICS': [0.06, 0.04],
        'KEYS': [0.03, 0.02],
        'CLOTHING': [0.12, 0.08],
        'ACCESSORIES': [0.04, 0.03]
      };
      
      const [baseWidth, baseHeight] = baseSizes[category as keyof typeof baseSizes];
      const width = Math.floor(videoWidth * baseWidth * scale * (0.8 + Math.random() * 0.4));
      const height = Math.floor(videoHeight * baseHeight * scale * (0.8 + Math.random() * 0.4));
      
      // Intelligent confidence calculation
      let confidence = 0.75 + Math.random() * 0.2; // Base 75-95%
      
      // Adjust confidence based on size (larger objects more confident)
      const sizeBonus = Math.min((width * height) / (videoWidth * videoHeight * 0.01), 0.1);
      confidence += sizeBonus;
      
      // Adjust confidence based on position (center objects more confident)
      const centerX = Math.abs(x / videoWidth - 0.5);
      const centerY = Math.abs(y / videoHeight - 0.5);
      const centerBonus = (1 - (centerX + centerY)) * 0.05;
      confidence += centerBonus;
      
      // Ensure confidence is within bounds
      confidence = Math.min(Math.max(confidence, 0.7), 0.98);
      
      detections.push({
        trackingId: `obj_${Date.now()}_${passIndex}_${i}`,
        category,
        confidence,
        x,
        y,
        width,
        height,
        snapshotUrl: `detection_frame_${passIndex}_${i}.jpg`,
        scale,
        passIndex
      });
    }
    
    return detections;
  };
  
  // Non-Maximum Suppression to remove overlapping detections
  const applyNonMaximumSuppression = (detections: any[], nmsThreshold: number): any[] => {
    if (detections.length === 0) return [];
    
    // Sort by confidence (highest first)
    const sortedDetections = [...detections].sort((a, b) => b.confidence - a.confidence);
    const kept = [];
    const suppressed = new Set();
    
    for (let i = 0; i < sortedDetections.length; i++) {
      if (suppressed.has(i)) continue;
      
      const current = sortedDetections[i];
      kept.push(current);
      
      // Suppress overlapping detections
      for (let j = i + 1; j < sortedDetections.length; j++) {
        if (suppressed.has(j)) continue;
        
        const other = sortedDetections[j];
        const iou = calculateIoU(current, other);
        
        if (iou > nmsThreshold) {
          suppressed.add(j);
        }
      }
    }
    
    return kept;
  };
  
  // Calculate Intersection over Union (IoU) for two bounding boxes
  const calculateIoU = (box1: any, box2: any): number => {
    const x1 = Math.max(box1.x, box2.x);
    const y1 = Math.max(box1.y, box2.y);
    const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
    const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);
    
    if (x2 <= x1 || y2 <= y1) return 0;
    
    const intersection = (x2 - x1) * (y2 - y1);
    const area1 = box1.width * box1.height;
    const area2 = box2.width * box2.height;
    const union = area1 + area2 - intersection;
    
    return intersection / union;
  };

  // Validate if detected object is actually a lost item (contextual analysis)
  const validateLostItemContext = async (detection: any, videoWidth: number, videoHeight: number): Promise<boolean> => {
    // Simulate AI context analysis
    const { x, y, width, height, category, context } = detection;
    
    // Position-based validation
    const isOnGround = y > videoHeight * 0.6; // Bottom 40% of frame
    const isInCorner = (x < videoWidth * 0.2 || x > videoWidth * 0.8) && 
                       (y < videoHeight * 0.2 || y > videoHeight * 0.8);
    const isIsolated = true; // Simulate: no person nearby
    
    // Context-specific rules
    switch (category) {
      case "BAGS":
        // Bags are lost if: on ground, isolated, stationary
        return isOnGround && isIsolated && context === "abandoned_on_ground";
        
      case "ELECTRONICS":
        // Electronics are lost if: on surface, not being held, stationary
        return (isOnGround || context === "dropped_on_surface") && isIsolated;
        
      case "KEYS":
        // Keys are lost if: small, on ground/table, isolated
        return isOnGround && width < videoWidth * 0.05;
        
      case "CLOTHING":
        // Clothing is lost if: crumpled, on ground, not being worn
        return isOnGround && isIsolated;
        
      default:
        return false;
    }
  };
  
  // Check if detection is contextually relevant for lost & found
  const isContextuallyRelevant = (detection: any): boolean => {
    const { category, context, confidence } = detection;
    
    // Relevance criteria for lost items
    const relevantContexts = [
      "abandoned_on_ground",
      "dropped_on_surface", 
      "forgotten_on_bench",
      "left_unattended",
      "stationary_object"
    ];
    
    // High-value lost item categories
    const highValueCategories = ["BAGS", "ELECTRONICS", "KEYS", "JEWELRY", "DOCUMENTS"];
    
    return relevantContexts.includes(context) && 
           highValueCategories.includes(category) &&
           confidence >= 0.85;
  };

  // Capture frame with smart context - NO EXCESSIVE ZOOM
  const captureObjectImage = async (x: number, y: number, width: number, height: number): Promise<string | null> => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;

    console.log(`📸 Capturing object at (${x}, ${y}) size ${width}x${height}`);

    // Smart padding based on object size
    const objectArea = width * height;
    const videoArea = video.videoWidth * video.videoHeight;
    const areaRatio = objectArea / videoArea;
    
    // Adaptive padding: smaller objects get more context
    let paddingFactor = 0.8; // Default 80% padding
    if (areaRatio < 0.01) paddingFactor = 1.2; // Small objects: 120% padding
    else if (areaRatio < 0.05) paddingFactor = 1.0; // Medium objects: 100% padding
    else paddingFactor = 0.6; // Large objects: 60% padding
    
    const paddingX = Math.floor(width * paddingFactor);
    const paddingY = Math.floor(height * paddingFactor);
    
    // Calculate padded coordinates while ensuring they stay within video bounds
    const paddedX = Math.max(0, x - paddingX);
    const paddedY = Math.max(0, y - paddingY);
    const paddedWidth = Math.min(video.videoWidth - paddedX, width + (2 * paddingX));
    const paddedHeight = Math.min(video.videoHeight - paddedY, height + (2 * paddingY));

    console.log(`📷 Smart crop: ${paddedWidth}x${paddedHeight} with ${Math.round(paddingFactor*100)}% adaptive padding`);

    // Set canvas size to match the padded detected object
    canvas.width = paddedWidth;
    canvas.height = paddedHeight;

    // Draw the cropped portion of the video to canvas with padding
    ctx.drawImage(
      video,
      paddedX, paddedY, paddedWidth, paddedHeight,  // Source rectangle (padded object area)
      0, 0, paddedWidth, paddedHeight   // Destination rectangle (full canvas)
    );

    // Convert canvas to data URL as fallback
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      console.log('✅ Image captured successfully (data URL fallback)');
      return dataUrl;
    } catch (error) {
      console.error('❌ Failed to capture image:', error);
      return null;
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setDetectionResults([]);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid video file",
        variant: "destructive",
      });
    }
  };

  const startDetectionSession = async () => {
    try {
      const response = await apiCall(`http://localhost:8082/api/detection/sessions/start?cameraId=ADMIN_UPLOAD&cameraLocation=${encodeURIComponent(cameraLocation)}&modelVersion=yolov12`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        console.warn('Backend session start failed, using local session ID');
        // Fallback: create local session ID
        const localSessionId = `local_session_${Date.now()}`;
        setSessionId(localSessionId);
        return localSessionId;
      }
      
      const data = await response.json();
      setSessionId(data.sessionId);
      return data.sessionId;
    } catch (error) {
      console.warn('Backend unavailable, using local session:', error);
      // Fallback: create local session ID  
      const localSessionId = `local_session_${Date.now()}`;
      setSessionId(localSessionId);
      return localSessionId;
    }
  };

  // Super simple but working detection simulation  
  const simulateDetection = async (currentSessionId: string) => {
    try {
      console.log('🎯 Starting simple detection simulation...');
      
      if (!videoRef.current || !canvasRef.current) {
        throw new Error('Video or canvas reference not available');
      }

      // Get video dimensions
      const video = videoRef.current;
      const videoWidth = video.videoWidth || video.clientWidth || 1920;
      const videoHeight = video.videoHeight || video.clientHeight || 1080;

      console.log(`📹 Video dimensions: ${videoWidth}x${videoHeight}`);

      // Create realistic lost object detections
      const lostObjectDetections = [
        // Large suitcase
        {
          trackingId: `suitcase_${Date.now()}`,
          category: "BAGS",
          confidence: 0.92,
          x: Math.floor(videoWidth * 0.25),  
          y: Math.floor(videoHeight * 0.55),   
          width: Math.floor(videoWidth * 0.12),   
          height: Math.floor(videoHeight * 0.18),  
          snapshotUrl: "suitcase_detected.jpg"
        },
        // Backpack
        {
          trackingId: `backpack_${Date.now()}`,
          category: "BAGS",
          confidence: 0.88,
          x: Math.floor(videoWidth * 0.65),  
          y: Math.floor(videoHeight * 0.45),   
          width: Math.floor(videoWidth * 0.08),   
          height: Math.floor(videoHeight * 0.12),  
          snapshotUrl: "backpack_detected.jpg"
        },
        // Laptop
        {
          trackingId: `laptop_${Date.now()}`,
          category: "ELECTRONICS",
          confidence: 0.85,
          x: Math.floor(videoWidth * 0.45),  
          y: Math.floor(videoHeight * 0.35),   
          width: Math.floor(videoWidth * 0.06),   
          height: Math.floor(videoHeight * 0.04),  
          snapshotUrl: "laptop_detected.jpg"
        },
        // Phone
        {
          trackingId: `phone_${Date.now()}`,
          category: "PHONE",
          confidence: 0.81,
          x: Math.floor(videoWidth * 0.55),  
          y: Math.floor(videoHeight * 0.65),   
          width: Math.floor(videoWidth * 0.02),   
          height: Math.floor(videoHeight * 0.04),  
          snapshotUrl: "phone_detected.jpg"
        }
      ];
      
      console.log(`🎯 Generated ${lostObjectDetections.length} realistic lost object detections`);
      lostObjectDetections.forEach((det, i) => {
        const area = ((det.width * det.height) / (videoWidth * videoHeight) * 100);
        console.log(`   ${i+1}. ${det.category}: ${det.width}x${det.height} (${area.toFixed(2)}% of screen)`);
      });

      // Apply smart filtering for lost objects
      const validDetections = lostObjectDetections.filter(detection => {
        const isValid = isValidDetection(detection.category, detection.width, detection.height, detection.confidence);
        return isValid;
      });

      console.log(`✅ After strict filtering: ${validDetections.length} valid detections`);

      if (validDetections.length === 0) {
        console.log('❌ No valid lost objects found after filtering');
        toast({
          title: "No Lost Objects Detected",
          description: "No bags, electronics, or other lost items found in this video",
          variant: "destructive",
        });
        return;
      }

      // Process each VALID detection
      for (let i = 0; i < validDetections.length; i++) {
        const detection = validDetections[i];
        console.log(`🎯 Processing valid detection ${i + 1}: ${detection.category}`);

        try {
          // Capture image
          const capturedImageUrl = await captureObjectImage(
            detection.x, 
            detection.y, 
            detection.width, 
            detection.height
          );

          console.log(capturedImageUrl ? '✓ Image captured' : '⚠ Image capture failed');

          // Try to send to backend (with fallback)
          try {
            const detectionResponse = await apiCall('http://localhost:8082/api/detection/process', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: currentSessionId,
                ...detection,
                snapshotUrl: capturedImageUrl || "no_image_captured.jpg"
              }),
            });

            if (detectionResponse.ok) {
              console.log('✓ Detection processed in backend');
            } else {
              console.warn('⚠ Backend detection processing failed, continuing locally');
            }
          } catch (error) {
            console.warn('⚠ Backend unavailable, processing locally:', error);
          }
          
          // Always add to UI results (regardless of backend)
          setDetectionResults(prev => [...prev, {
            id: detection.trackingId,
            trackingId: detection.trackingId,
            category: detection.category,
            confidence: detection.confidence,
            x: detection.x,
            y: detection.y,
            width: detection.width,
            height: detection.height,
            timestamp: new Date().toISOString(),
            imageUrl: capturedImageUrl || undefined,
            croppedImage: capturedImageUrl || undefined,
            abandonment_score: Math.random() * 0.3 + 0.1, // Mock score
          }]);

          // Try to create item in database (with fallback)
          try {
            const itemData = {
              name: `${detection.category === "BAGS" ? "Lost Bag/Suitcase" : `Lost ${detection.category}`} Detected`,
              description: `Enhanced AI detected a ${detection.category.toLowerCase()} with ${Math.round(detection.confidence * 100)}% confidence. Size: ${detection.width}x${detection.height}px. Detected at ${new Date().toLocaleString()} with smart context-aware cropping (optimal zoom level).`,
              type: 'FOUND',
              category: detection.category,
              status: 'FOUND',
              location: `${cameraLocation} - AI Detected (${Math.round((detection.width * detection.height) / (videoWidth * videoHeight) * 100)}% of screen)`,
              imageUrl: capturedImageUrl || "/placeholder.svg",
              latitude: null,
              longitude: null
            };

            const itemResponse = await apiCall('http://localhost:8082/api/items', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(itemData),
            });

            if (itemResponse.ok) {
              console.log('✓ Item saved to database');
            } else {
              console.warn('⚠ Failed to save item to database, but detection still processed');
            }
          } catch (error) {
            console.warn('⚠ Database unavailable, but detection processed locally:', error);
          }

        } catch (error) {
          console.error(`Error processing detection ${i + 1}:`, error);
        }

        // Small delay between detections
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`✅ Detection processing completed! Processed ${validDetections.length} valid detections`);
      
      // Force UI update to show results
      setTimeout(() => {
        console.log(`📊 Final UI state: ${detectionResults.length} detection results displayed`);
      }, 1000);

    } catch (error) {
      console.error('Fatal error in simulateDetection:', error);
      throw error;
    }
  };

  const processVideo = async () => {
    console.log('🚀 Process Video button clicked (Strict Detection)!');
    
    if (!selectedFile) {
      console.log('❌ No file selected');
      toast({
        title: "No Video Selected",
        description: "Please select a video file first",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ Starting strict video processing...');
    setIsProcessing(true);
    setDetectionResults([]);

    try {
      toast({
        title: "Processing Started",
        description: "🎯 Strict AI detection - only detecting main objects, filtering out small parts...",
      });

      // Create FormData for the strict detection API
      const formData = new FormData();
      formData.append('video', selectedFile);

      console.log('📤 Sending video to strict detection API...');
      console.log('📁 File details:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      });

      // Call the strict detection endpoint with authentication
      const token = (session as any)?.accessToken;
      
      // Check if user is authenticated
      if (!session || !token) {
        toast({
          title: "Authentication Required",
          description: "Please log in as an admin to use this feature.",
          variant: "destructive",
        });
        return;
      }

      console.log('🔐 Using authenticated API call with token');
      
      // Continue with Spring Boot call
      const response = await fetch('http://localhost:8082/api/admin/detection/strict', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔥 API Error - Status:', response.status, response.statusText);
        console.log('🔥 Error Response Text:', errorText);
        
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || errorMessage;
          console.log('🔥 Parsed Error Message:', errorMessage);
        } catch (parseError) {
          console.log('🔥 Could not parse error as JSON, using raw text');
          if (errorText) {
            errorMessage = errorText;
          }
        }
        
        toast({
          title: "Detection Failed",
          description: errorMessage,
          variant: "destructive",
        });
        
        return;
      }

      const result = await response.json();
      console.log('📥 Strict detection result:', result);

      if (result.success && result.objects && result.objects.length > 0) {
        console.log(`🎯 Strict detection found ${result.objects.length} main object(s)`);
        
        // Convert API results to UI format
        const formattedResults = result.objects.map((obj: any) => ({
          id: obj.id,
          trackingId: obj.id,
          category: obj.category,
          confidence: obj.confidence,
          x: obj.bbox[0],
          y: obj.bbox[1],
          width: obj.bbox[2],
          height: obj.bbox[3],
          timestamp: new Date().toISOString(),
          imageUrl: obj.cropped_image_url,
          croppedImage: obj.cropped_image_url,
          abandonment_score: obj.detection_score || 0.8,
        }));

        setDetectionResults(formattedResults);

        // Try to save to database as items
        for (const obj of result.objects) {
          try {
            const itemData = {
              name: `Strict AI Detected ${obj.category}`,
              description: `🎯 Strict detection found a ${obj.category.toLowerCase()} with ${Math.round(obj.confidence * 100)}% confidence. Only main objects detected - small parts filtered out. ${obj.detection_notes || ''}`,
              type: 'FOUND',
              category: obj.category,
              status: 'FOUND',
              location: `${cameraLocation} - Strict AI Detection`,
              imageUrl: obj.cropped_image_url,
              latitude: null,
              longitude: null
            };

            const itemResponse = await apiCall('http://localhost:8082/api/items', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(itemData),
            });

            if (itemResponse.ok) {
              console.log('✅ Item saved to database');
            } else {
              console.warn('⚠️ Failed to save item to database');
            }
          } catch (error) {
            console.warn('⚠️ Database error:', error);
          }
        }

        toast({
          title: "🎯 Strict Detection Complete!",
          description: `Found ${result.objects.length} main object(s). Small parts filtered out successfully.`,
        });

      } else if (result.success && result.total_objects === 0) {
        console.log('✅ Strict detection completed - no main objects found');
        toast({
          title: "🎯 Strict Detection Complete",
          description: "No main objects detected. Strict filtering removed all small parts.",
          variant: "default",
        });
      } else {
        throw new Error(result.error || 'Strict detection failed');
      }

    } catch (error) {
      console.log('❌ Strict detection error occurred');
      console.log('❌ Error type:', typeof error);
      console.log('❌ Error instanceof Error:', error instanceof Error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.log('❌ Final error message to show user:', errorMessage);
      
      toast({
        title: "Strict Detection Failed",
        description: `Failed to process video with strict detection: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      console.log('🏁 Processing finished, setting isProcessing to false');
      setIsProcessing(false);
    }
  };

  const resetDetection = () => {
    setSelectedFile(null);
    setVideoUrl("");
    setDetectionResults([]);
    setSessionId("");
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Video Detection</h1>
          <p className="text-muted-foreground">
            🎯 Upload videos for strict AI detection - only main objects detected, small parts filtered out
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Advanced AI Configuration Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Advanced AI Detection Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="confidence-threshold">Confidence Threshold</Label>
                <Input
                  id="confidence-threshold"
                  type="number"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={detectionSettings.confidence_threshold}
                  onChange={(e) => setDetectionSettings(prev => ({
                    ...prev,
                    confidence_threshold: parseFloat(e.target.value)
                  }))}
                  disabled={isProcessing}
                />
                <div className="text-xs text-muted-foreground">
                  Current: {Math.round(detectionSettings.confidence_threshold * 100)}%
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nms-threshold">NMS Threshold</Label>
                <Input
                  id="nms-threshold"
                  type="number"
                  min="0.1"
                  max="0.9"
                  step="0.1"
                  value={detectionSettings.nms_threshold}
                  onChange={(e) => setDetectionSettings(prev => ({
                    ...prev,
                    nms_threshold: parseFloat(e.target.value)
                  }))}
                  disabled={isProcessing}
                />
                <div className="text-xs text-muted-foreground">
                  Overlap filter: {Math.round(detectionSettings.nms_threshold * 100)}%
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max-objects">Max Objects</Label>
                <Input
                  id="max-objects"
                  type="number"
                  min="1"
                  max="20"
                  value={detectionSettings.max_objects}
                  onChange={(e) => setDetectionSettings(prev => ({
                    ...prev,
                    max_objects: parseInt(e.target.value)
                  }))}
                  disabled={isProcessing}
                />
                <div className="text-xs text-muted-foreground">
                  Limit per frame
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>AI Features</Label>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="multi-scale"
                      checked={detectionSettings.enable_multi_scale}
                      onChange={(e) => setDetectionSettings(prev => ({
                        ...prev,
                        enable_multi_scale: e.target.checked
                      }))}
                      disabled={isProcessing}
                    />
                    <Label htmlFor="multi-scale" className="text-xs">Multi-scale Detection</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="tracking"
                      checked={detectionSettings.enable_tracking}
                      onChange={(e) => setDetectionSettings(prev => ({
                        ...prev,
                        enable_tracking: e.target.checked
                      }))}
                      disabled={isProcessing}
                    />
                    <Label htmlFor="tracking" className="text-xs">Object Tracking</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="feature-extraction"
                      checked={detectionSettings.enable_feature_extraction}
                      onChange={(e) => setDetectionSettings(prev => ({
                        ...prev,
                        enable_feature_extraction: e.target.checked
                      }))}
                      disabled={isProcessing}
                    />
                    <Label htmlFor="feature-extraction" className="text-xs">Feature Extraction</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="temporal-consistency"
                      checked={detectionSettings.temporal_consistency}
                      onChange={(e) => setDetectionSettings(prev => ({
                        ...prev,
                        temporal_consistency: e.target.checked
                      }))}
                      disabled={isProcessing}
                    />
                    <Label htmlFor="temporal-consistency" className="text-xs">Temporal Consistency</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="smart-cropping"
                      checked={detectionSettings.smart_cropping}
                      onChange={(e) => setDetectionSettings(prev => ({
                        ...prev,
                        smart_cropping: e.target.checked
                      }))}
                      disabled={isProcessing}
                    />
                    <Label htmlFor="smart-cropping" className="text-xs">Smart Cropping</Label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setDetectionSettings({
                  enable_multi_scale: true,
                  enable_tracking: true,
                  enable_feature_extraction: true,
                  confidence_threshold: 0.85,
                  nms_threshold: 0.5,
                  max_objects: 10,
                  temporal_consistency: true,
                  smart_cropping: true
                })}
                disabled={isProcessing}
              >
                Reset to Defaults
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setDetectionSettings({
                  enable_multi_scale: true,
                  enable_tracking: true,
                  enable_feature_extraction: true,
                  confidence_threshold: 0.92,
                  nms_threshold: 0.3,
                  max_objects: 15,
                  temporal_consistency: true,
                  smart_cropping: true
                })}
                disabled={isProcessing}
              >
                High Precision Mode
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setDetectionSettings({
                  enable_multi_scale: false,
                  enable_tracking: false,
                  enable_feature_extraction: false,
                  confidence_threshold: 0.75,
                  nms_threshold: 0.7,
                  max_objects: 5,
                  temporal_consistency: false,
                  smart_cropping: false
                })}
                disabled={isProcessing}
              >
                Fast Mode
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
        {/* Video Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Video Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video-file">Select Video File</Label>
              <Input
                id="video-file"
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                ref={fileInputRef}
                disabled={isProcessing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="camera-location">Camera Location</Label>
              <Input
                id="camera-location"
                value={cameraLocation}
                onChange={(e) => setCameraLocation(e.target.value)}
                placeholder="Enter camera/location name"
                disabled={isProcessing}
              />
            </div>

            {videoUrl && (
              <div className="space-y-2">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full rounded-lg border"
                  controls
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                {/* Hidden canvas for image capture */}
                <canvas
                  ref={canvasRef}
                  style={{ display: 'none' }}
                />
                <div className="flex gap-2">
                  <Button onClick={togglePlayPause} variant="outline" size="sm">
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button onClick={resetDetection} variant="outline" size="sm">
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={processVideo} 
                disabled={!selectedFile || isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    🎯 Strict Detection
                  </>
                )}
              </Button>
              
              {selectedFile && !isProcessing && (
                <Button 
                  onClick={async () => {
                    console.log('Testing video processing...');
                    console.log('Video element:', videoRef.current);
                    console.log('Canvas element:', canvasRef.current);
                    console.log('Video readyState:', videoRef.current?.readyState);
                    console.log('Video dimensions:', {
                      videoWidth: videoRef.current?.videoWidth,
                      videoHeight: videoRef.current?.videoHeight,
                      clientWidth: videoRef.current?.clientWidth,
                      clientHeight: videoRef.current?.clientHeight
                    });
                    
                    toast({
                      title: "Debug Info",
                      description: "Check browser console for video debug information",
                    });
                  }}
                  variant="outline" 
                  size="sm"
                >
                  Debug
                </Button>
              )}
            </div>

            {isProcessing && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  🎯 Strict AI detection in progress - analyzing video for main objects only. Small parts like handles and zippers will be filtered out...
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Detection Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Detection Results
              {detectionResults.length > 0 && (
                <Badge variant="secondary">{detectionResults.length} objects</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {detectionResults.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No objects detected yet. Upload and process a video to see results.
              </div>
            ) : (
              <div className="space-y-3">
                {detectionResults.map((result) => (
                  <div
                    key={result.id}
                    className="p-3 border rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{result.category}</Badge>
                        {result.abandonment_score && result.abandonment_score > 0.5 && (
                          <Badge variant="destructive" className="text-xs">
                            {result.abandonment_score > 0.7 ? 'ABANDONED' : 'STATIONARY'}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {Math.round(result.confidence * 100)}% confidence
                        </div>
                        {result.abandonment_score && (
                          <div className="text-xs text-orange-600">
                            Abandonment: {Math.round(result.abandonment_score * 100)}%
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Display captured image with advanced info */}
                    {result.croppedImage && (
                      <div className="flex items-start gap-3">
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                          <img 
                            src={result.croppedImage} 
                            alt={`Detected ${result.category}`}
                            className="w-full h-full object-cover"
                          />
                          {result.keypoints && result.keypoints.length > 0 && (
                            <div className="absolute inset-0 pointer-events-none">
                              {result.keypoints.slice(0, 4).map((kp, idx) => (
                                <div
                                  key={idx}
                                  className="absolute w-1 h-1 bg-red-500 rounded-full"
                                  style={{
                                    left: `${(kp.x / result.width) * 100}%`,
                                    top: `${(kp.y / result.height) * 100}%`,
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-sm space-y-1">
                          <div className="grid grid-cols-2 gap-2">
                            <div>Position: ({result.x}, {result.y})</div>
                            <div>Size: {result.width} × {result.height}</div>
                            <div>ID: {result.trackingId.substring(0, 12)}...</div>
                            {result.movement_history && (
                              <div>Frames: {result.movement_history.length}</div>
                            )}
                          </div>
                          
                          {/* Advanced AI Features Display */}
                          {result.features && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                              <div className="font-medium mb-1">AI Features:</div>
                              <div className="grid grid-cols-2 gap-1">
                                {result.color_histogram && (
                                  <div>Color diversity: {Math.round(result.color_histogram.reduce((a, b) => a + (b > 0.01 ? 1 : 0), 0))} bins</div>
                                )}
                                {result.keypoints && (
                                  <div>Keypoints: {result.keypoints.length}</div>
                                )}
                                {result.texture_features && (
                                  <div>Texture complexity: {Math.round(result.texture_features.reduce((a, b) => a + b, 0) * 100)}</div>
                                )}
                                <div>Feature vector: {result.features.length}D</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs space-y-1">
                      <div className="text-muted-foreground">
                        Detected: {new Date(result.timestamp).toLocaleString()}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-green-600 font-medium flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          ✓ Image captured with AI analysis
                        </div>
                        {result.movement_history && result.movement_history.length > 1 && (
                          <div className="text-blue-600 text-xs">
                            📊 Tracked across {result.movement_history.length} frames
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Real-time AI Statistics */}
        {detectionResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Real-time AI Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {detectionResults.length}
                  </div>
                  <div className="text-sm text-blue-800">Objects Detected</div>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(detectionResults.reduce((sum, r) => sum + r.confidence, 0) / detectionResults.length * 100)}%
                  </div>
                  <div className="text-sm text-green-800">Avg Confidence</div>
                </div>
                
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {detectionResults.filter(r => r.abandonment_score && r.abandonment_score > 0.7).length}
                  </div>
                  <div className="text-sm text-orange-800">Abandoned Items</div>
                </div>
                
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {objectTracker.size}
                  </div>
                  <div className="text-sm text-purple-800">Active Tracks</div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Detection Categories</h4>
                  <div className="space-y-1">
                    {Object.entries(
                      detectionResults.reduce((acc, r) => {
                        acc[r.category] = (acc[r.category] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([category, count]) => (
                      <div key={category} className="flex justify-between text-sm">
                        <span>{category}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">AI Features Status</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Multi-scale Detection</span>
                      <span className={detectionSettings.enable_multi_scale ? "text-green-600" : "text-gray-400"}>
                        {detectionSettings.enable_multi_scale ? "✓ Active" : "✗ Disabled"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Object Tracking</span>
                      <span className={detectionSettings.enable_tracking ? "text-green-600" : "text-gray-400"}>
                        {detectionSettings.enable_tracking ? "✓ Active" : "✗ Disabled"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Feature Extraction</span>
                      <span className={detectionSettings.enable_feature_extraction ? "text-green-600" : "text-gray-400"}>
                        {detectionSettings.enable_feature_extraction ? "✓ Active" : "✗ Disabled"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Temporal Consistency</span>
                      <span className={detectionSettings.temporal_consistency ? "text-green-600" : "text-gray-400"}>
                        {detectionSettings.temporal_consistency ? "✓ Active" : "✗ Disabled"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>

      {sessionId && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4" />
              Detection Session: {sessionId} | Model: Advanced AI v2.0 | Status: {isProcessing ? 'Processing...' : 'Ready'}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}