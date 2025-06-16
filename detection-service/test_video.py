#!/usr/bin/env python3
"""
Test object detection on a video file
This script will process a video and detect lost objects
"""

import cv2
import argparse
import logging
import time
from object_detector import ObjectDetector

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VideoTester:
    def __init__(self, video_path, model_path=None):
        self.video_path = video_path
        self.detector = ObjectDetector(model_path=model_path)
        self.output_path = f"output_{int(time.time())}.mp4"
        
    def process_video(self):
        """Process the video and save results"""
        if not self.detector.start_video(self.video_path):
            logger.error(f"Failed to open video: {self.video_path}")
            return
            
        # Get video properties
        cap = self.detector.cap
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Log video info
        logger.info("📊 Video Info:")
        logger.info(f"- Duration: {total_frames/fps:.1f} seconds")
        logger.info(f"- FPS: {fps:.1f}")
        logger.info(f"- Total Frames: {total_frames}")
        logger.info(f"🎥 Processing video: {self.video_path}")
        
        # Initialize video writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(self.output_path, fourcc, fps, (width, height))
        
        frame_count = 0
        start_time = time.time()
        
        while True:
            frame = self.detector.get_frame()
            if frame is None:
                break
                
            # Process frame
            results = self.detector.process_frame(frame)
            
            # Draw detections
            for det in results:
                x1, y1, x2, y2 = map(int, det['bbox'])
                score = det.get('score', det.get('confidence', 0.0))
                class_name = det.get('class_name', det.get('class', 'unknown'))
                
                # Draw bounding box
                color = (0, 255, 0) if det.get('is_stationary', False) else (0, 0, 255)
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                
                # Draw label
                label = f"{class_name} ({score:.2f})"
                if det.get('is_stationary', False):
                    label += " [Stationary]"
                cv2.putText(frame, label, (x1, y1-10),
                          cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            
            # Write frame
            out.write(frame)
            
            # Update progress
            frame_count += 1
            if frame_count % 30 == 0:  # Log every 30 frames
                elapsed = time.time() - start_time
                fps = frame_count / elapsed
                logger.info(f"Processed {frame_count}/{total_frames} frames ({fps:.1f} FPS)")
        
        # Cleanup
        out.release()
        self.detector.stop_video()
        logger.info(f"✅ Processing complete. Output saved to: {self.output_path}")

def main():
    parser = argparse.ArgumentParser(description='Test object detection on video')
    parser.add_argument('video_path', help='Path to video file')
    parser.add_argument('--model', default=None, help='Path to model file (optional)')
    args = parser.parse_args()
    
    tester = VideoTester(args.video_path, args.model)
    tester.process_video()

if __name__ == '__main__':
    main() 