#!/usr/bin/env python3
"""
Test the enhanced detector directly
"""
import tempfile
import cv2
import numpy as np
from strict_suitcase_detector import StrictSuitcaseDetector
import os

def create_test_video():
    """Create a test video with obvious objects"""
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(temp_file.name, fourcc, 30.0, (640, 480))
    
    for i in range(60):  # 2 seconds
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        
        # Draw multiple obvious objects
        # Big brown rectangle (suitcase)
        cv2.rectangle(frame, (200, 150), (450, 350), (101, 67, 33), -1)
        cv2.rectangle(frame, (210, 160), (440, 180), (150, 100, 50), -1)  # Handle
        
        # Add text
        cv2.putText(frame, "SUITCASE", (250, 250), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        
        # Add a bottle
        cv2.rectangle(frame, (100, 300), (120, 400), (0, 255, 0), -1)
        
        # Add a cup
        cv2.circle(frame, (500, 350), 30, (255, 255, 0), -1)
        
        out.write(frame)
    
    out.release()
    return temp_file.name

def test_enhanced_detector():
    """Test the enhanced detector"""
    print("🔍 TESTING ENHANCED DETECTOR")
    print("=" * 50)
    
    # Create test video
    video_path = create_test_video()
    print(f"📹 Created test video: {video_path}")
    
    try:
        # Test different confidence thresholds
        thresholds = [0.01, 0.05, 0.1, 0.2]
        
        for threshold in thresholds:
            print(f"\n🎯 Testing with confidence threshold: {threshold}")
            
            detector = StrictSuitcaseDetector(confidence_threshold=threshold)
            result = detector.detect_main_suitcase(video_path)
            
            if result['detection_result']['object_found']:
                obj = result['detected_object']
                print(f"✅ FOUND OBJECT!")
                print(f"   Category: {obj['category']}")
                print(f"   Class: {obj['class_name']}")
                print(f"   Confidence: {obj['confidence']}")
                print(f"   Time: {obj['found_at_time']}")
                break
            else:
                print(f"❌ No objects found with threshold {threshold}")
        
        print(f"\n📋 Final result: {'✅ SUCCESS' if result['detection_result']['object_found'] else '❌ NO DETECTION'}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        # Cleanup
        os.unlink(video_path)

if __name__ == "__main__":
    test_enhanced_detector()