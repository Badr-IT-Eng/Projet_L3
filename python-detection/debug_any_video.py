#!/usr/bin/env python3
"""
Debug any video to see exactly what YOLO detects
"""
import cv2
import numpy as np
from ultralytics import YOLO
import tempfile
import os

def debug_video_detection(video_path=None):
    """Debug what YOLO detects in any video"""
    print("🔍 COMPREHENSIVE VIDEO DETECTION DEBUG")
    print("=" * 50)
    
    # If no video provided, create a realistic test video
    if video_path is None:
        video_path = create_realistic_suitcase_video()
        print(f"📹 Created test video: {video_path}")
        cleanup_video = True
    else:
        print(f"📹 Analyzing provided video: {video_path}")
        cleanup_video = False
    
    # Load YOLO
    model = YOLO('yolov8n.pt')
    print("✅ YOLO model loaded")
    
    # Process video
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"❌ Cannot open video: {video_path}")
        return
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    print(f"📹 Video info: {width}x{height}, {fps:.1f}fps, {total_frames} frames")
    
    frame_count = 0
    all_detections = []
    confidence_levels = [0.001, 0.01, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5]
    
    # Analyze multiple frames
    frames_to_check = [10, 30, 50] if total_frames > 50 else [total_frames // 2]
    
    for target_frame in frames_to_check:
        cap.set(cv2.CAP_PROP_POS_FRAMES, target_frame)
        ret, frame = cap.read()
        if not ret:
            continue
            
        print(f"\n🎬 Analyzing frame {target_frame}")
        
        # Test different confidence levels
        for conf_level in confidence_levels:
            results = model(frame, verbose=False, conf=conf_level)
            
            detections_at_conf = []
            for result in results:
                if result.boxes is not None:
                    for box in result.boxes:
                        confidence = float(box.conf[0])
                        class_id = int(box.cls[0])
                        class_name = model.names[class_id]
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        
                        detections_at_conf.append({
                            'class_name': class_name,
                            'confidence': confidence,
                            'bbox': [int(x1), int(y1), int(x2-x1), int(y2-y1)],
                            'area_ratio': ((x2-x1) * (y2-y1)) / (width * height)
                        })
            
            if detections_at_conf:
                print(f"  📊 Conf {conf_level}: {len(detections_at_conf)} detections")
                for det in detections_at_conf[:3]:  # Show top 3
                    print(f"    - {det['class_name']}: {det['confidence']:.3f} (area: {det['area_ratio']:.4f})")
                break  # Found detections, no need to try lower confidence
        
        if not detections_at_conf:
            print(f"  ❌ No detections found at any confidence level")
    
    cap.release()
    
    # Test with the enhanced detector
    print(f"\n🧪 Testing with Enhanced Detector...")
    try:
        from strict_suitcase_detector import StrictSuitcaseDetector
        detector = StrictSuitcaseDetector(confidence_threshold=0.01)
        result = detector.detect_main_suitcase(video_path)
        
        if result['detection_result']['object_found']:
            obj = result['detected_object']
            print(f"✅ Enhanced Detector SUCCESS!")
            print(f"   Category: {obj['category']}")
            print(f"   Class: {obj['class_name']}")
            print(f"   Confidence: {obj['confidence']}")
        else:
            print(f"❌ Enhanced Detector found nothing")
    except Exception as e:
        print(f"❌ Enhanced Detector error: {e}")
    
    # Cleanup
    if cleanup_video:
        os.unlink(video_path)
    
    print(f"\n💡 RECOMMENDATIONS:")
    print(f"   1. Make sure your suitcase video has good lighting")
    print(f"   2. Suitcase should be clearly visible (not too small)")
    print(f"   3. Try uploading as admin user in the frontend")
    print(f"   4. Check browser console for JavaScript errors")

def create_realistic_suitcase_video():
    """Create a very realistic suitcase video"""
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(temp_file.name, fourcc, 30.0, (640, 480))
    
    for i in range(90):  # 3 seconds
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        
        # Create a very realistic suitcase
        # Main body (dark blue/black)
        cv2.rectangle(frame, (180, 120), (460, 320), (30, 30, 80), -1)
        
        # Add texture lines (suitcase panels)
        cv2.line(frame, (200, 140), (440, 140), (50, 50, 100), 2)
        cv2.line(frame, (200, 300), (440, 300), (50, 50, 100), 2)
        cv2.line(frame, (320, 120), (320, 320), (50, 50, 100), 2)
        
        # Handle (metallic)
        cv2.rectangle(frame, (290, 100), (350, 120), (180, 180, 180), -1)
        cv2.rectangle(frame, (295, 105), (345, 115), (200, 200, 200), -1)
        
        # Wheels
        cv2.circle(frame, (200, 310), 8, (80, 80, 80), -1)
        cv2.circle(frame, (440, 310), 8, (80, 80, 80), -1)
        
        # Zipper
        cv2.line(frame, (180, 220), (460, 220), (120, 120, 120), 3)
        for x in range(180, 460, 20):
            cv2.circle(frame, (x, 220), 2, (150, 150, 150), -1)
        
        # Add some floor texture
        cv2.rectangle(frame, (0, 350), (640, 480), (40, 40, 40), -1)
        
        # Add slight rotation for realism
        angle = (i * 0.5) % 360
        if angle < 180:
            # Slightly move suitcase
            offset = int(5 * np.sin(np.radians(angle * 2)))
            frame = np.roll(frame, offset, axis=1)
        
        out.write(frame)
    
    out.release()
    return temp_file.name

if __name__ == "__main__":
    debug_video_detection()