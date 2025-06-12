#!/usr/bin/env python3
"""
Test object detection on a video file
This script will process a video and detect lost objects
"""

import cv2
import torch
from pathlib import Path
import logging
from datetime import datetime
import json
import requests
from object_detector import DetectionService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VideoTester:
    def __init__(self, video_path, model_path='stable_model_epoch_30.pth'):
        self.video_path = video_path
        self.model_path = model_path
        
        # Adjust parameters for short videos
        self.config = {
            'model_path': model_path,
            'confidence_threshold': 0.4,  # Lower confidence threshold for testing
            'abandon_threshold': 10,      # Reduced to 10 frames for short videos
            'camera_location': 'Test Video',
            'api_base_url': 'http://localhost:8080',
            'snapshots_dir': 'snapshots',
            'short_video_mode': True      # Enable short video mode
        }
        
        # Create snapshots directory
        Path(self.config['snapshots_dir']).mkdir(exist_ok=True)
        
        # Initialize detection service
        self.service = DetectionService(self.config)
        
        # Get video properties
        cap = cv2.VideoCapture(video_path)
        self.fps = cap.get(cv2.CAP_PROP_FPS)
        self.total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        self.duration = self.total_frames / self.fps
        cap.release()
        
        logger.info(f"📊 Video Info:")
        logger.info(f"- Duration: {self.duration:.1f} seconds")
        logger.info(f"- FPS: {self.fps:.1f}")
        logger.info(f"- Total Frames: {self.total_frames}")
        
    def process_video(self):
        """Process the video file and detect objects"""
        if not Path(self.video_path).exists():
            logger.error(f"❌ Video file not found: {self.video_path}")
            return
            
        logger.info(f"🎥 Processing video: {self.video_path}")
        cap = cv2.VideoCapture(self.video_path)
        
        if not cap.isOpened():
            logger.error("❌ Could not open video file")
            return
            
        frame_count = 0
        detections_per_frame = []
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            # Process every frame for short videos
            # Run detection
            results = self.service.process_frame(frame)
            
            if results and 'detections' in results:
                detections_per_frame.append(len(results['detections']))
                
                # Draw results on frame
                for det in results['detections']:
                    x1, y1, x2, y2 = map(int, det['bbox'])
                    label = f"{det['class']} ({det['confidence']:.2f})"
                    
                    # Draw bounding box
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.putText(frame, label, (x1, y1-10),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
            # Show frame with detection info
            elapsed_time = frame_count / self.fps
            cv2.putText(frame, f"Time: {elapsed_time:.1f}s", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.putText(frame, f"Frame: {frame_count}/{self.total_frames}", (10, 60),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            # Show frame
            cv2.imshow('Lost Item Detection', frame)
            
            frame_count += 1
            
            # Press 'q' to quit
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
        cap.release()
        cv2.destroyAllWindows()
        
        # Print detection summary
        if detections_per_frame:
            avg_detections = sum(detections_per_frame) / len(detections_per_frame)
            logger.info("\n📊 Detection Summary:")
            logger.info(f"- Average detections per frame: {avg_detections:.1f}")
            logger.info(f"- Total frames processed: {frame_count}")
            logger.info(f"- Total detections: {sum(detections_per_frame)}")
            
            # Check if any objects were detected as lost
            if hasattr(self.service, 'lost_objects') and self.service.lost_objects:
                logger.info("\n🚨 Lost Objects Detected:")
                for obj_id in self.service.lost_objects:
                    obj = self.service.tracked_objects.get(obj_id, {})
                    if obj:
                        logger.info(f"- {obj.get('class', 'Unknown')} at {obj.get('location', 'Unknown location')}")
            else:
                logger.info("\n✅ No objects were detected as lost in this short video")
                logger.info("💡 Tip: For better testing, try recording a longer video (30+ seconds)")
                logger.info("      or place objects in the frame for longer periods")
        
        logger.info("\n✅ Video processing complete!")
        logger.info("💾 Check the snapshots directory for any detected lost objects")

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Test object detection on a video file')
    parser.add_argument('video_path', help='Path to the video file')
    parser.add_argument('--model', default='stable_model_epoch_30.pth',
                      help='Path to the model file')
    args = parser.parse_args()
    
    tester = VideoTester(args.video_path, args.model)
    tester.process_video()

if __name__ == '__main__':
    main() 