#!/usr/bin/env python3
"""
Debug YOLO raw detections to see what's actually being detected
"""
import cv2
import tempfile
import numpy as np
from ultralytics import YOLO

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

def debug_yolo_raw():
    """Debug raw YOLO detections"""
    print("🔍 YOLO RAW DETECTION DEBUG")
    print("=" * 50)
    
    # Load YOLO
    model = YOLO('yolov8n.pt')
    print("✅ YOLO model loaded")
    
    # Create test video
    video_path = create_test_video()
    print(f"📹 Created test video: {video_path}")
    
    # Process video
    cap = cv2.VideoCapture(video_path)
    frame_count = 0
    total_detections = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        frame_count += 1
        
        if frame_count == 30:  # Check middle frame
            print(f"\n🎬 Analyzing frame {frame_count}")
            
            # Run YOLO with very low confidence
            results = model(frame, verbose=False, conf=0.01)  # Very low confidence
            
            for result in results:
                if result.boxes is not None:
                    print(f"📊 Found {len(result.boxes)} raw detections")
                    
                    for i, box in enumerate(result.boxes):
                        confidence = float(box.conf[0])
                        class_id = int(box.cls[0])
                        class_name = model.names[class_id]
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        
                        print(f"  {i+1}. {class_name}: {confidence:.3f} confidence at ({x1:.0f},{y1:.0f},{x2:.0f},{y2:.0f})")
                        total_detections += 1
                else:
                    print("❌ No boxes detected")
            break
    
    cap.release()
    
    print(f"\n📋 SUMMARY:")
    print(f"Total raw detections: {total_detections}")
    print(f"Available YOLO classes: {len(model.names)}")
    print(f"Sample classes: {list(model.names.values())[:20]}")
    
    # Cleanup
    import os
    os.unlink(video_path)

if __name__ == "__main__":
    debug_yolo_raw()