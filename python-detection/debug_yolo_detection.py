#!/usr/bin/env python3
"""
Debug YOLO detection to see what objects are being detected in the suitcase video
"""

import cv2
import numpy as np
from ultralytics import YOLO
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load YOLO model
model = YOLO('yolov8n.pt')

# Test video
video_path = '../copied_services/python-services/detection-service/output.mp4'

cap = cv2.VideoCapture(video_path)
if not cap.isOpened():
    print(f"Cannot open video: {video_path}")
    exit()

frame_count = 0
while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    frame_count += 1
    
    # Only process a few frames
    if frame_count in [5, 10, 15]:
        print(f"\n=== FRAME {frame_count} ===")
        
        # Get YOLO detections
        results = model(frame, verbose=False)
        
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = box.conf[0].cpu().numpy()
                    class_id = int(box.cls[0].cpu().numpy())
                    class_name = result.names[class_id]
                    
                    w, h = int(x2-x1), int(y2-y1)
                    area_ratio = (w * h) / (frame.shape[0] * frame.shape[1])
                    
                    print(f"  {class_name}: {confidence:.2f} conf, {w}x{h} ({area_ratio:.3f} of frame)")
            else:
                print("  No detections")

cap.release()
print(f"\nProcessed {frame_count} frames")