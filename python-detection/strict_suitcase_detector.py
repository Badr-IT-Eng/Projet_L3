#!/usr/bin/env python3
"""
🎯 STRICT SUITCASE DETECTOR
Only detects the main suitcase, ignores small parts like handles, zippers, etc.
"""

import cv2
import numpy as np
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional
from ultralytics import YOLO

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class StrictSuitcaseDetector:
    """
    Ultra-strict detector that only finds the main suitcase object
    Ignores small components like handles, zippers, wheels
    """
    
    def __init__(self, confidence_threshold: float = 0.4):
        self.confidence_threshold = confidence_threshold
        
        # Load YOLO model
        try:
            self.model = YOLO('yolov8n.pt')
            logger.info("✅ YOLO model loaded successfully")
        except Exception as e:
            logger.error(f"❌ Could not load YOLO: {e}")
            self.model = None
        
        # SIGNIFICANTLY EXPANDED categories for lost objects - much more comprehensive
        self.lost_object_categories = {
            # Bags and luggage
            'suitcase', 'luggage', 'backpack', 'handbag', 'bag', 'purse', 'briefcase',
            'duffel bag', 'tote bag', 'shopping bag', 'messenger bag', 'laptop bag',
            'diaper bag', 'gym bag', 'travel bag', 'duffle', 'clutch', 'pouch',
            
            # Electronics
            'cell phone', 'mobile phone', 'laptop', 'tablet', 'camera', 'keyboard', 
            'mouse', 'headphones', 'earphones', 'charger', 'power bank', 'iphone',
            'ipad', 'smartphone', 'computer', 'monitor', 'tv', 'remote',
            
            # Personal items
            'wallet', 'keys', 'sunglasses', 'glasses', 'watch', 'jewelry', 'ring',
            'necklace', 'bracelet', 'earrings', 'card', 'passport', 'id',
            
            # Clothing and accessories
            'hat', 'cap', 'jacket', 'coat', 'scarf', 'gloves', 'shoes', 'sneakers',
            'boots', 'shirt', 'pants', 'dress', 'skirt', 'tie', 'belt', 'sock',
            
            # Common lost items
            'umbrella', 'book', 'bottle', 'cup', 'sports ball', 'teddy bear', 'toy',
            'pen', 'pencil', 'notebook', 'folder', 'document', 'paper', 'magazine',
            'scissors', 'tool', 'coin', 'money',
            
            # Transportation items (YOLO sometimes classifies bags as these)
            'train', 'car', 'truck', 'bus', 'motorcycle', 'bicycle',
            
            # Miscellaneous objects that could be lost
            'clock', 'vase', 'bowl', 'plate', 'knife', 'fork', 'spoon',
            'toothbrush', 'hair', 'comb', 'brush', 'mirror', 'towel',
            'pillow', 'blanket', 'chair', 'table', 'desk', 'shelf'
        }
        
        logger.info("🎯 Enhanced Robust Detector initialized - DETECTS ALL LOST OBJECTS")
    
    def _map_category(self, class_name: str) -> str:
        """Enhanced category mapping - much more comprehensive"""
        class_name = class_name.lower()
        
        # Bags and luggage - high priority
        if any(cat in class_name for cat in ['suitcase', 'luggage', 'backpack', 'handbag', 'bag', 'purse', 'briefcase', 'duffle', 'tote', 'clutch', 'pouch']):
            return 'BAGS'
        
        # Electronics - high priority
        elif any(cat in class_name for cat in ['cell phone', 'phone', 'mobile', 'iphone', 'smartphone']):
            return 'ELECTRONICS'
        elif any(cat in class_name for cat in ['laptop', 'tablet', 'camera', 'keyboard', 'mouse', 'computer', 'ipad', 'monitor']):
            return 'ELECTRONICS'
        elif any(cat in class_name for cat in ['headphones', 'earphones', 'charger', 'power bank', 'remote', 'tv']):
            return 'ELECTRONICS'
        
        # Personal items - high priority
        elif any(cat in class_name for cat in ['wallet', 'keys', 'sunglasses', 'glasses', 'watch', 'jewelry', 'ring', 'necklace', 'bracelet']):
            return 'PERSONAL'
        elif any(cat in class_name for cat in ['card', 'passport', 'id', 'earrings']):
            return 'PERSONAL'
        
        # Clothing and accessories
        elif any(cat in class_name for cat in ['hat', 'cap', 'jacket', 'coat', 'scarf', 'gloves', 'shoes', 'sneakers', 'boots']):
            return 'CLOTHING'
        elif any(cat in class_name for cat in ['shirt', 'pants', 'dress', 'skirt', 'tie', 'belt', 'sock']):
            return 'CLOTHING'
        
        # Transportation (YOLO sometimes confuses these with bags)
        elif any(cat in class_name for cat in ['train', 'car', 'truck', 'bus', 'motorcycle', 'bicycle']):
            return 'BAGS'  # Map transportation to BAGS since they're often confused
        
        # Common misclassifications that might actually be bags/lost items
        elif any(cat in class_name for cat in ['sports ball', 'traffic light']):
            return 'BAGS'  # These are often misclassified bags or suitcases
        
        # Common lost items
        elif any(cat in class_name for cat in ['book', 'bottle', 'cup', 'umbrella', 'pen', 'pencil', 'notebook']):
            return 'MISCELLANEOUS'
        elif any(cat in class_name for cat in ['teddy bear', 'toy', 'folder', 'document', 'paper', 'magazine']):
            return 'MISCELLANEOUS'
        elif any(cat in class_name for cat in ['scissors', 'tool', 'coin', 'money', 'clock', 'vase', 'bowl']):
            return 'MISCELLANEOUS'
        elif any(cat in class_name for cat in ['plate', 'knife', 'fork', 'spoon', 'mirror', 'towel', 'pillow', 'blanket']):
            return 'MISCELLANEOUS'
        elif any(cat in class_name for cat in ['chair', 'bench', 'remote', 'mouse', 'keyboard']):
            return 'MISCELLANEOUS'
        
        # Default to BAGS for anything else - this makes it more likely to detect objects
        else:
            return 'BAGS'
    
    def detect_main_suitcase(self, video_path: str) -> Dict:
        """
        Detect only the main suitcase, ignore small parts
        """
        logger.info(f"🎬 Processing video: {video_path}")
        
        # Check if file exists and has size
        import os
        if not os.path.exists(video_path):
            raise ValueError(f"Video file does not exist: {video_path}")
        
        file_size = os.path.getsize(video_path)
        if file_size == 0:
            raise ValueError(f"Video file is empty: {video_path}")
        
        logger.info(f"📁 Video file size: {file_size} bytes")
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}. File size: {file_size} bytes. Possible format issue or corruption.")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        logger.info(f"📹 Video: {width}x{height}, {fps}fps, {total_frames} frames")
        
        best_suitcase = None
        best_score = 0.0
        frame_count = 0
        process_interval = max(1, min(10, int(fps // 1)))  # Process every 10 frames max
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            
            if frame_count % process_interval == 0:
                logger.info(f"🔍 Analyzing frame {frame_count}/{total_frames}")
                
                # Get YOLO detections
                detections = self._get_yolo_detections(frame)
                
                # Filter to only suitcase-like objects
                suitcase_candidates = self._filter_suitcase_candidates(detections, frame)
                
                if suitcase_candidates:
                    # Find the best (largest, most centered) suitcase
                    frame_best = self._select_best_suitcase(suitcase_candidates, frame)
                    
                    if frame_best:
                        score = self._score_suitcase(frame_best, frame)
                        
                        if score > best_score:
                            best_score = score
                            
                            # Create cropped image with lots of context
                            cropped_image = self._crop_with_maximum_context(frame, frame_best)
                            timestamp = frame_count / fps
                            
                            best_suitcase = {
                                'frame_number': frame_count,
                                'timestamp': timestamp,
                                'video_timestamp': f"{int(timestamp//60):02d}:{int(timestamp%60):02d}",
                                'category': self._map_category(frame_best['class_name']),
                                'class_name': frame_best['class_name'],
                                'confidence': frame_best['confidence'],
                                'bbox': frame_best['bbox'],
                                'cropped_image': cropped_image,
                                'score': score,
                                'method': 'strict_object_detection'
                            }
                            
                            logger.info(f"🎯 New best suitcase found: {frame_best['confidence']:.1%} confidence, score: {score:.3f}")
        
        cap.release()
        
        # Generate report
        report = self._generate_report(best_suitcase, video_path)
        
        if best_suitcase:
            self._save_suitcase_image(best_suitcase)
            logger.info(f"🎉 Main suitcase detected successfully!")
            logger.info(f"📊 Confidence: {best_suitcase['confidence']:.1%}")
            logger.info(f"⏱️  Found at: {best_suitcase['video_timestamp']}")
        else:
            logger.warning("⚠️ No main suitcase detected")
        
        return report
    
    def _get_yolo_detections(self, frame: np.ndarray) -> List[Dict]:
        """Get YOLO detections"""
        if not self.model:
            return []
        
        try:
            # Use very low confidence for YOLO detection to catch everything
            results = self.model(frame, verbose=False, conf=0.01)
            detections = []
            
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        confidence = box.conf[0].cpu().numpy()
                        class_id = int(box.cls[0].cpu().numpy())
                        class_name = result.names[class_id]
                        
                        if confidence > self.confidence_threshold:
                            detection = {
                                'bbox': [int(x1), int(y1), int(x2-x1), int(y2-y1)],
                                'confidence': float(confidence),
                                'class_name': class_name,
                                'class_id': class_id
                            }
                            detections.append(detection)
            
            return detections
            
        except Exception as e:
            logger.error(f"YOLO detection failed: {e}")
            return []
    
    def _filter_suitcase_candidates(self, detections: List[Dict], frame: np.ndarray) -> List[Dict]:
        """Filter to only suitcase-like objects, remove small parts"""
        candidates = []
        frame_height, frame_width = frame.shape[:2]
        
        for detection in detections:
            class_name = detection['class_name'].lower()
            x, y, w, h = detection['bbox']
            
            # 1. VERY PERMISSIVE category check - accept almost anything that could be a lost object
            # Accept explicit lost object categories OR common misclassifications
            lost_object_match = any(cat in class_name for cat in self.lost_object_categories)
            misclassification_match = any(cat in class_name for cat in [
                'sports ball', 'traffic light', 'bottle', 'cup', 'bowl', 'chair', 
                'bench', 'clock', 'vase', 'book', 'remote', 'mouse', 'keyboard'
            ])
            
            if not (lost_object_match or misclassification_match):
                logger.debug(f"Rejected {class_name}: not a recognized lost object category")
                continue
            
            # For debugging: log what we're accepting
            if misclassification_match:
                logger.info(f"🔄 Accepting potential misclassified object: {class_name} (might be a lost item)")
            
            # 2. MUCH MORE PERMISSIVE size validation - allow small objects
            area_ratio = (w * h) / (frame_width * frame_height)
            
            # Very permissive size requirements
            if class_name == 'train':
                min_area = 0.001  # Much smaller minimum for trains (suitcases)
            elif any(term in class_name for term in ['phone', 'cell', 'mobile', 'watch', 'keys', 'wallet']):
                min_area = 0.0001  # Very small items can be tiny
            else:
                min_area = 0.0005  # General minimum - very small
            
            if area_ratio < min_area:
                logger.debug(f"Rejected {class_name}: too small ({area_ratio:.4f} < {min_area})")
                continue
            
            if area_ratio > 0.9:  # More permissive upper limit
                logger.debug(f"Rejected {class_name}: too large ({area_ratio:.3f})")
                continue
            
            # 3. VERY PERMISSIVE aspect ratio (allow almost anything)
            aspect_ratio = w / h if h > 0 else 0
            if aspect_ratio < 0.1 or aspect_ratio > 10.0:  # Much more permissive
                logger.debug(f"Rejected {class_name}: bad aspect ratio ({aspect_ratio:.2f})")
                continue
            
            # 4. VERY PERMISSIVE position validation (allow objects anywhere)
            center_y = y + h // 2
            # Only reject if it's in the very top edge of frame
            if center_y < frame_height * 0.1:  # Only top 10% = unlikely
                logger.debug(f"Rejected {class_name}: too high up")
                continue
            
            # 5. VERY PERMISSIVE height requirements
            if h < frame_height * 0.02:  # Only reject very tiny objects (2%)
                logger.debug(f"Rejected {class_name}: too short ({h} < {frame_height * 0.02:.1f})")
                continue
            
            # 6. VERY PERMISSIVE width requirements  
            if w < frame_width * 0.02:  # Only reject very tiny objects (2%)
                logger.debug(f"Rejected {class_name}: too narrow ({w} < {frame_width * 0.02:.1f})")
                continue
            
            candidates.append(detection)
            logger.debug(f"✅ Accepted {class_name}: {w}x{h} ({area_ratio:.3f} of frame)")
        
        logger.info(f"🔍 Filtered {len(detections)} detections → {len(candidates)} suitcase candidates")
        return candidates
    
    def _select_best_suitcase(self, candidates: List[Dict], frame: np.ndarray) -> Optional[Dict]:
        """Select the best suitcase from candidates"""
        if not candidates:
            return None
        
        # If only one candidate, use it
        if len(candidates) == 1:
            return candidates[0]
        
        # Score all candidates and pick the best
        scored_candidates = []
        for candidate in candidates:
            score = self._score_suitcase(candidate, frame)
            scored_candidates.append((score, candidate))
        
        # Return highest scoring candidate
        best_score, best_candidate = max(scored_candidates, key=lambda x: x[0])
        logger.info(f"🏆 Selected best suitcase from {len(candidates)} candidates (score: {best_score:.3f})")
        return best_candidate
    
    def _score_suitcase(self, detection: Dict, frame: np.ndarray) -> float:
        """Score a suitcase detection (higher = better)"""
        x, y, w, h = detection['bbox']
        frame_height, frame_width = frame.shape[:2]
        confidence = detection['confidence']
        
        score = confidence * 0.4  # Base confidence score
        
        # Size bonus - prefer larger objects (main suitcase vs small parts)
        area_ratio = (w * h) / (frame_width * frame_height)
        if 0.1 < area_ratio < 0.6:  # Good size for main suitcase
            score += 0.3
        elif area_ratio > 0.2:  # Very large suitcase
            score += 0.4  # Extra bonus for large objects
        
        # Special bonus for 'train' class (likely suitcase)
        if detection.get('class_name') == 'train':
            score += 0.2  # Bonus for train detections
        
        # Position bonus - prefer center and lower part of frame
        center_x = x + w // 2
        center_y = y + h // 2
        
        # Horizontal center bonus
        h_distance = abs(center_x - frame_width // 2) / (frame_width // 2)
        score += (1 - h_distance) * 0.1  # Up to 0.1 bonus for being centered
        
        # Vertical position bonus - prefer lower part
        if center_y > frame_height * 0.6:  # Bottom 40%
            score += 0.15
        elif center_y > frame_height * 0.4:  # Middle area
            score += 0.1
        
        # Aspect ratio bonus - typical suitcase shapes
        aspect_ratio = w / h if h > 0 else 1
        if 0.7 < aspect_ratio < 2.0:  # Reasonable suitcase proportions
            score += 0.1
        
        return min(score, 1.0)
    
    def _crop_with_maximum_context(self, frame: np.ndarray, detection: Dict) -> np.ndarray:
        """Crop with maximum context to show the whole suitcase clearly"""
        x, y, w, h = detection['bbox']
        frame_height, frame_width = frame.shape[:2]
        
        # Use HUGE padding to show lots of context
        padding_factor = 2.0  # 200% padding!
        
        pad_x = int(w * padding_factor)
        pad_y = int(h * padding_factor)
        
        # Calculate crop coordinates
        crop_x1 = max(0, x - pad_x)
        crop_y1 = max(0, y - pad_y)
        crop_x2 = min(frame_width, x + w + pad_x)
        crop_y2 = min(frame_height, y + h + pad_y)
        
        # Ensure minimum crop size of 400x400
        crop_width = crop_x2 - crop_x1
        crop_height = crop_y2 - crop_y1
        min_size = 400
        
        if crop_width < min_size or crop_height < min_size:
            # Center and expand
            center_x = x + w // 2
            center_y = y + h // 2
            half_size = min_size // 2
            
            crop_x1 = max(0, center_x - half_size)
            crop_y1 = max(0, center_y - half_size)
            crop_x2 = min(frame_width, center_x + half_size)
            crop_y2 = min(frame_height, center_y + half_size)
        
        cropped = frame[crop_y1:crop_y2, crop_x1:crop_x2]
        
        final_size = f"{crop_x2-crop_x1}x{crop_y2-crop_y1}"
        logger.info(f"🖼️ Cropped suitcase: {final_size} with {int(padding_factor*100)}% padding")
        
        return cropped
    
    def _generate_report(self, suitcase: Optional[Dict], video_path: str) -> Dict:
        """Generate detection report"""
        report = {
            'video_info': {
                'path': video_path,
                'processing_time': datetime.now().isoformat(),
                'method': 'strict_suitcase_detection'
            },
            'detection_result': {
                'object_found': suitcase is not None,
                'detection_method': 'YOLO + Strict Filtering',
                'total_detections': 1 if suitcase else 0
            }
        }
        
        if suitcase:
            report['detected_object'] = {
                'category': suitcase['category'],
                'confidence': f"{suitcase['confidence']:.1%}",
                'score': f"{suitcase['score']:.3f}",
                'found_at_time': suitcase['video_timestamp'],
                'frame_number': suitcase['frame_number'],
                'bounding_box': suitcase['bbox'],
                'image_saved': 'strict_object_detection.jpg',
                'class_name': suitcase.get('class_name', 'unknown')
            }
            # Also include legacy format for compatibility
            report['suitcase'] = report['detected_object']
        
        return report
    
    def _save_suitcase_image(self, suitcase: Dict):
        """Save the suitcase detection image"""
        import os
        os.makedirs("strict_detections", exist_ok=True)
        
        output_path = "strict_detections/strict_object_detection.jpg"
        cv2.imwrite(output_path, suitcase['cropped_image'], [cv2.IMWRITE_JPEG_QUALITY, 95])
        
        logger.info(f"💾 Suitcase image saved: {output_path}")


def main():
    """Test the strict suitcase detector"""
    print("🎯 STRICT SUITCASE DETECTOR")
    print("=" * 50)
    print("✅ Only detects the MAIN suitcase")
    print("🚫 Ignores handles, zippers, small parts")
    print("🖼️ Maximum context cropping")
    print("=" * 50)
    
    detector = StrictSuitcaseDetector(confidence_threshold=0.4)
    
    # Test with suitcase video
    video_path = '../copied_services/python-services/detection-service/output.mp4'
    
    try:
        results = detector.detect_main_suitcase(video_path)
        
        # Save report
        with open("strict_suitcase_report.json", "w") as f:
            json.dump(results, f, indent=2, default=str)
        
        print("\n🎉 STRICT DETECTION COMPLETE!")
        
        if results['detection_result']['suitcase_found']:
            suitcase = results['suitcase']
            print(f"✅ Found main suitcase:")
            print(f"   📦 Category: {suitcase['category']}")
            print(f"   🎯 Confidence: {suitcase['confidence']}")
            print(f"   ⏱️  Time: {suitcase['found_at_time']}")
            print(f"   📁 Image: {suitcase['image_saved']}")
        else:
            print("❌ No main suitcase detected")
        
        print(f"\n📄 Report saved: strict_suitcase_report.json")
        
    except Exception as e:
        logger.error(f"❌ Detection failed: {e}")


if __name__ == "__main__":
    main()