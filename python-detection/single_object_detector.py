#!/usr/bin/env python3
"""
🎯 SINGLE OBJECT DETECTOR 🎯
Optimized for detecting ONE primary lost object (like your suitcase)
Uses the ultra-enhanced detector with single-object focus
"""

import cv2
import numpy as np
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional
from ultra_enhanced_detector import UltraEnhancedDetector

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SingleObjectDetector:
    """
    🎯 Specialized detector for single lost objects
    Perfect for scenarios like: one suitcase, one backpack, etc.
    """
    
    def __init__(self, confidence_threshold: float = 0.8):
        self.confidence_threshold = confidence_threshold
        
        # Initialize the ultra-enhanced detector
        self.detector = UltraEnhancedDetector(
            device='auto',
            confidence_threshold=confidence_threshold
        )
        
        # Single object detection settings
        self.single_object_mode = True
        self.tracking_history = []
        
        logger.info("🎯 Single Object Detector initialized - Optimized for ONE primary object")
    
    def detect_single_object(self, video_path: str) -> Dict:
        """
        Main detection method - focuses on finding ONE primary object
        """
        logger.info(f"🎬 Starting single object detection for: {video_path}")
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")
        
        # Video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        logger.info(f"📹 Video: {width}x{height}, {fps}fps, {total_frames} frames")
        
        # Track ALL detections across frames to find the absolute best
        all_detections = []
        frame_count = 0
        process_interval = max(1, min(5, int(fps // 2)))  # Process every 5 frames max, or 2 times per second
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            
            # Process frames for the single object
            if frame_count % process_interval == 0:
                logger.info(f"🔍 Analyzing frame {frame_count}/{total_frames}")
                
                # Get detections from ultra-enhanced detector
                detections = self.detector.detect_objects_ensemble(frame)
                
                if detections:
                    # Process each detection and score it
                    for detection in detections:
                        total_score = self._calculate_total_score(detection, frame, frame_count, fps)
                        cropped_image = self.detector.smart_crop_with_context(frame, detection)
                        timestamp = frame_count / fps
                        
                        detection_data = {
                            'frame_number': frame_count,
                            'timestamp': timestamp,
                            'video_timestamp': f"{int(timestamp//60):02d}:{int(timestamp%60):02d}",
                            'detection': detection,
                            'cropped_image': cropped_image,
                            'total_score': total_score,
                            'confidence': detection['confidence'],
                            'category': detection['category'],
                            'method': 'single_object_focused'
                        }
                        
                        all_detections.append(detection_data)
        
        cap.release()
        
        # Find the ABSOLUTE best detection across all frames
        best_detection = None
        if all_detections:
            # First, prioritize BAGS category (suitcases, backpacks)
            bags_detections = [d for d in all_detections if d['category'] == 'BAGS']
            
            if bags_detections:
                # Use bags if found
                bags_detections.sort(key=lambda x: x['total_score'], reverse=True)
                best_detection = bags_detections[0]
                logger.info(f"🎯 Prioritized BAGS detection from {len(bags_detections)} bag candidates")
            else:
                # Fall back to best overall detection
                all_detections.sort(key=lambda x: x['total_score'], reverse=True)
                best_detection = all_detections[0]
                logger.info(f"🎯 Best detection selected from {len(all_detections)} candidates")
            
            logger.info(f"📊 Object: {best_detection['category']}")
            logger.info(f"🎯 Confidence: {best_detection['confidence']:.1%}")
            logger.info(f"⏱️  Found at: {best_detection['video_timestamp']}")
            logger.info(f"🏆 Total score: {best_detection['total_score']:.3f}")
        
        # Generate single object report with only the best detection
        frame_detections = [{'frame': d['frame_number'], 'detection': d['detection'], 'score': d['total_score']} for d in all_detections]
        report = self._generate_single_object_report(best_detection, frame_detections, video_path)
        
        # Save the best detection image if found
        if best_detection:
            self._save_best_detection(best_detection)
            logger.info(f"🎉 Single object detected successfully!")
        else:
            logger.warning("⚠️ No suitable object detected in the video")
        
        return report
    
    def _select_best_detection(self, detections: List[Dict], frame: np.ndarray) -> Optional[Dict]:
        """
        Select the single best detection from multiple candidates
        """
        if not detections:
            return None
        
        # If only one detection, return it
        if len(detections) == 1:
            return detections[0]
        
        # Score all detections and pick the best
        scored_detections = []
        for detection in detections:
            score = self._score_detection(detection, frame)
            scored_detections.append((score, detection))
        
        # Return the highest scoring detection
        best_score, best_detection = max(scored_detections, key=lambda x: x[0])
        return best_detection
    
    def _score_detection(self, detection: Dict, frame: np.ndarray) -> float:
        """
        Score a detection based on various factors
        """
        x, y, w, h = detection['bbox']
        frame_height, frame_width = frame.shape[:2]
        
        score = detection['confidence'] * 0.5  # Base confidence
        
        # Size scoring - heavily favor larger objects (suitcases are big!)
        area_ratio = (w * h) / (frame_width * frame_height)
        if 0.05 < area_ratio < 0.4:  # Large objects like suitcases
            score += 0.3  # Big bonus for large objects
        elif 0.02 < area_ratio < 0.05:  # Medium objects
            score += 0.1
        elif area_ratio < 0.01:  # Too small (likely false positive)
            score -= 0.2
        elif area_ratio > 0.5:  # Too large (unrealistic)
            score -= 0.1
        
        # Position scoring - prefer bottom half of frame
        center_y = y + h // 2
        if center_y > frame_height * 0.5:  # Bottom half
            score += 0.1
        if center_y > frame_height * 0.7:  # Bottom 30%
            score += 0.1
        
        # Category preference - HEAVILY favor bags/suitcases
        category_scores = {
            'BAGS': 0.4,         # HUGE preference for bags/suitcases
            'ELECTRONICS': 0.05, # Very low preference 
            'MISCELLANEOUS': 0.02 # Minimal preference
        }
        score += category_scores.get(detection.get('category', ''), 0)
        
        return min(score, 1.0)
    
    def _calculate_total_score(self, detection: Dict, frame: np.ndarray, 
                              frame_number: int, fps: float) -> float:
        """
        Calculate comprehensive score including temporal factors
        """
        base_score = self._score_detection(detection, frame)
        
        # Temporal bonus - prefer detections from middle of video
        video_progress = frame_number / (fps * 30)  # Assume reasonable video length
        if 0.2 < video_progress < 0.8:  # Middle portion of video
            base_score += 0.05
        
        # Consistency bonus if we've seen similar detections
        consistency_bonus = self._calculate_consistency_bonus(detection)
        base_score += consistency_bonus
        
        return min(base_score, 1.0)
    
    def _calculate_consistency_bonus(self, detection: Dict) -> float:
        """
        Bonus for consistent detections across frames
        """
        if not self.tracking_history:
            self.tracking_history.append(detection)
            return 0.0
        
        # Simple consistency check
        recent_categories = [d.get('category', '') for d in self.tracking_history[-5:]]
        current_category = detection.get('category', '')
        
        if recent_categories.count(current_category) >= 2:
            return 0.05  # Small bonus for consistency
        
        self.tracking_history.append(detection)
        return 0.0
    
    def _generate_single_object_report(self, best_detection: Optional[Dict], 
                                     frame_detections: List[Dict], video_path: str) -> Dict:
        """
        Generate comprehensive report for single object detection
        """
        report = {
            'video_info': {
                'path': video_path,
                'processing_time': datetime.now().isoformat(),
                'method': 'single_object_focused_detection'
            },
            'detection_result': {
                'object_found': best_detection is not None,
                'total_frames_analyzed': len(frame_detections),
                'detection_method': 'Ultra-Enhanced Ensemble with Single-Object Focus'
            }
        }
        
        if best_detection:
            report['best_detection'] = {
                'category': best_detection['category'],
                'confidence': f"{best_detection['confidence']:.1%}",
                'total_score': f"{best_detection['total_score']:.3f}",
                'found_at_time': best_detection['video_timestamp'],
                'frame_number': best_detection['frame_number'],
                'image_saved': f"single_object_detection.jpg",
                'bounding_box': best_detection['detection']['bbox']
            }
            
            # Analysis of detection consistency
            categories_found = [fd['detection']['category'] for fd in frame_detections]
            category_counts = {}
            for cat in categories_found:
                category_counts[cat] = category_counts.get(cat, 0) + 1
            
            report['detection_analysis'] = {
                'categories_detected': category_counts,
                'most_consistent_category': max(category_counts.items(), key=lambda x: x[1])[0] if category_counts else None,
                'detection_stability': len(set(categories_found)) <= 2  # Good if 1-2 categories only
            }
        else:
            report['detection_result']['reason'] = 'No object meeting confidence and quality criteria found'
        
        return report
    
    def _save_best_detection(self, detection: Dict):
        """
        Save the best detection image
        """
        import os
        os.makedirs("single_detections", exist_ok=True)
        
        output_path = "single_detections/single_object_detection.jpg"
        
        # Save with high quality
        cv2.imwrite(output_path, detection['cropped_image'], [
            cv2.IMWRITE_JPEG_QUALITY, 95,
            cv2.IMWRITE_JPEG_OPTIMIZE, 1
        ])
        
        logger.info(f"💾 Best detection saved: {output_path}")


def main():
    """
    Demo for single object detection
    """
    print("🎯 SINGLE OBJECT DETECTOR")
    print("=" * 50)
    print("🎪 Optimized for detecting ONE primary lost object")
    print("✅ Perfect for suitcases, backpacks, single items")
    print("🚫 No more multiple false detections!")
    print("=" * 50)
    
    # Initialize single object detector
    detector = SingleObjectDetector(confidence_threshold=0.8)
    
    # Example usage - replace with your video path
    video_path = "your_suitcase_video.mp4"
    
    try:
        # Detect single object
        results = detector.detect_single_object(video_path)
        
        # Save report
        with open("single_object_report.json", "w") as f:
            json.dump(results, f, indent=2, default=str)
        
        print("\n🎉 SINGLE OBJECT DETECTION COMPLETE!")
        
        if results['detection_result']['object_found']:
            print(f"🎯 Object found: {results['best_detection']['category']}")
            print(f"📊 Confidence: {results['best_detection']['confidence']}")
            print(f"⏱️  Time: {results['best_detection']['found_at_time']}")
            print(f"📁 Image: {results['best_detection']['image_saved']}")
        else:
            print("⚠️ No suitable object detected")
        
        print(f"📄 Full report: single_object_report.json")
        
    except Exception as e:
        logger.error(f"❌ Detection failed: {e}")


if __name__ == "__main__":
    main()