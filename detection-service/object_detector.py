#!/usr/bin/env python3
"""
RECOVR Lost Object Detector
Detects objects that have been left unattended for too long
"""

import cv2
import torch
import numpy as np
from pathlib import Path
import logging
from datetime import datetime
import json
import requests
from collections import defaultdict
import time
import os
from PIL import Image
import io
import uuid
import sys
from ultralytics import YOLO

os.environ['QT_QPA_PLATFORM'] = 'xcb'

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class ObjectDetector:
    def __init__(self, model_path=None, num_classes=80, device=None):
        # Load YOLOv8x model for better accuracy
        self.model = YOLO('yolov8x.pt')  # Using YOLOv8 extra large model
        self.device = device or ('cuda' if torch.cuda.is_available() else 'cpu')
        self.conf_threshold = 0.25  # Lower threshold to catch more potential matches
        self.iou_threshold = 0.45
        self.target_size = (640, 640)
        self.cap = None
        self.tracked_objects = {}
        self.next_id = 0
        self.stationary_threshold = 30  # pixels
        self.stationary_frames = 30  # frames
        self.min_detection_interval = 5.0  # seconds
        self.max_tracking_distance = 100  # pixels
        self.target_class = 'suitcase'  # We're specifically looking for suitcases
        
        # Print available class names for debugging
        print('Loaded YOLO model class names:', self.model.names, file=sys.stderr)

    def start_video(self, video_path):
        """Start video capture from file or camera"""
        if video_path.isdigit():
            self.cap = cv2.VideoCapture(int(video_path))
        else:
            self.cap = cv2.VideoCapture(str(video_path))
        return self.cap.isOpened()

    def stop_video(self):
        """Stop video capture"""
        if self.cap is not None:
            self.cap.release()
            self.cap = None

    def get_frame(self):
        """Get next frame from video"""
        if self.cap is None:
            return None
        ret, frame = self.cap.read()
        return frame if ret else None

    def process_frame(self, frame):
        """Process a single frame for object detection"""
        if frame is None:
            return []

        # Resize frame for model input
        resized = cv2.resize(frame, self.target_size)
        
        # Run YOLOv8 inference
        results = self.model(resized, conf=self.conf_threshold, iou=self.iou_threshold)[0]
        
        detections = []
        current_time = time.time()
        
        # Process detections
        for r in results.boxes.data.tolist():
            x1, y1, x2, y2, conf, cls = r
            cls = int(cls)
            
            # Get class name
            class_name = self.model.names[cls]
            
            # Only process if it's a suitcase or similar object
            if class_name in ['suitcase', 'backpack', 'handbag']:
                # Convert coordinates to original size
                x1 = int(x1 * frame.shape[1] / self.target_size[0])
                y1 = int(y1 * frame.shape[0] / self.target_size[1])
                x2 = int(x2 * frame.shape[1] / self.target_size[0])
                y2 = int(y2 * frame.shape[0] / self.target_size[1])
                
                # Calculate center point
                center_x = (x1 + x2) // 2
                center_y = (y1 + y2) // 2
                
                # Check if this is a new or existing object
                obj_id = None
                min_dist = float('inf')
                
                for tracked_id, tracked_obj in self.tracked_objects.items():
                    if current_time - tracked_obj['last_detection_time'] < self.min_detection_interval:
                        continue
                        
                    dist = np.sqrt((center_x - tracked_obj['center_x'])**2 + 
                                 (center_y - tracked_obj['center_y'])**2)
                    if dist < self.max_tracking_distance and dist < min_dist:
                        min_dist = dist
                        obj_id = tracked_id
                
                if obj_id is None:
                    obj_id = self.next_id
                    self.next_id += 1
                    self.tracked_objects[obj_id] = {
                        'center_x': center_x,
                        'center_y': center_y,
                        'last_detection_time': current_time,
                        'stationary_frames': 0,
                        'last_position': (center_x, center_y)
                    }
                else:
                    # Update tracked object
                    tracked_obj = self.tracked_objects[obj_id]
                    last_x, last_y = tracked_obj['last_position']
                    dist = np.sqrt((center_x - last_x)**2 + (center_y - last_y)**2)
                    
                    if dist < self.stationary_threshold:
                        tracked_obj['stationary_frames'] += 1
                    else:
                        tracked_obj['stationary_frames'] = 0
                    
                    tracked_obj['center_x'] = center_x
                    tracked_obj['center_y'] = center_y
                    tracked_obj['last_position'] = (center_x, center_y)
                    tracked_obj['last_detection_time'] = current_time
                
                is_stationary = self.tracked_objects[obj_id]['stationary_frames'] >= self.stationary_frames
                
                detections.append({
                    'bbox': [x1, y1, x2, y2],
                    'class': class_name,
                    'score': float(conf),
                    'id': obj_id,
                    'is_stationary': is_stationary
                })
                
                logger.debug(f"Detected {class_name} with confidence: {conf:.2f} (Stationary: {is_stationary})")
        
        return detections

    def process_video(self, video_path, output_path=None, save_to_db=True, location=None, skip_frames=4):
        """Process entire video and optionally save results"""
        try:
            width, height = map(int, self.start_video(video_path))
            print(f"Processing video: {video_path}")
            print(f"Resolution: {width}x{height}")
            print(f"Location: {location}")
            
            frame_count = 0
            all_detections = []
            out = None
            
            while True:
                ret, frame = self.cap.read()
                if not ret:
                    break
                    
                frame_count += 1
                if frame_count % skip_frames != 0:
                    continue
                
                # Process frame
                detections = self.process_frame(frame)
                
                if detections:
                    # Draw detections (draws all detections now)
                    frame = self._draw_detections(frame, detections)
                    
                    # Save to database (only if stationary and enabled)
                    if save_to_db:
                        for det in detections:
                            if det.get('is_stationary', False) and det['class'] in ['suitcase', 'backpack', 'handbag']: # Only save target stationary classes
                                self._save_to_database(det, frame)
                    
                    all_detections.extend(detections)
                
                # Save output video if requested
                if output_path:
                    if out is None:
                        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
                        out = cv2.VideoWriter(output_path, fourcc, 30.0, (width, height))
                    out.write(frame)
                
                # Show frame
                cv2.imshow('Detection', frame)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
            
            # Cleanup
            if out is not None:
                out.release()
            self.cap.release()
            cv2.destroyAllWindows()
            
            return all_detections
            
        except Exception as e:
            logger.error(f"Error processing video: {str(e)}")
            if self.cap is not None:
                self.cap.release()
            if out is not None:
                out.release()
            cv2.destroyAllWindows()
            raise
    
    def _draw_detections(self, frame, detections):
        """Draw detection boxes on frame"""
        for det in detections:
            x1, y1, x2, y2 = det['bbox']
            conf = det['score']
            cls_name = det['class'] # Use cls_name from detection dict
            is_stationary = det['is_stationary']
            
            # Special highlighting for target classes (e.g., suitcases)
            if cls_name == self.target_class:
                color = (0, 255, 255)  # Yellow for target class
                thickness = 3
                label = f"{cls_name}: {conf:.2f}"
                if is_stationary:
                    label += " (STATIONARY)"
                cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)
            else:
                color = (0, 255, 0)  # Green for other objects
                thickness = 1
                label = f"{cls_name}: {conf:.2f}"
                if is_stationary:
                    label += " (STATIONARY)"
                cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
            
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, thickness)
        
        return frame
    
    def _save_detection_image(self, frame, det):
        """Save detection image to file"""
        x1, y1, x2, y2 = det['bbox']
        
        # Create snapshots directory if it doesn't exist
        os.makedirs('snapshots', exist_ok=True)
        
        # Crop the object from the frame
        try:
            object_img = frame[y1:y2, x1:x2]
            if object_img.size == 0:
                print(f"❌ Empty crop from box [{x1}, {y1}, {x2}, {y2}]")
                # Use a small part of the frame instead
                center_x, center_y = frame.shape[1] // 2, frame.shape[0] // 2
                x1, y1 = max(0, center_x - 50), max(0, center_y - 50)
                x2, y2 = min(frame.shape[1]-1, center_x + 50), min(frame.shape[0]-1, center_y + 50)
                object_img = frame[y1:y2, x1:x2]
            
            # Generate a unique filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            class_name = det['class'].replace(' ', '_')
            filename = f"snapshots/{class_name}_{timestamp}.jpg"
            
            # Save the image
            cv2.imwrite(filename, object_img)
            
            return filename
        except Exception as e:
            print(f"❌ Error saving detection image: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _save_to_database(self, det, frame):
        """Save detections to database via API"""
        api_url = "http://localhost:8082/api/items"

        try:
            # Save the detection image
            image_path = self._save_detection_image(frame, det)
            if not image_path:
                print("❌ Failed to save detection image")
                return False
            
            # Convert relative path to absolute for API
            abs_image_path = os.path.abspath(image_path)
            print(f"📸 Saved detection image to: {abs_image_path}")
            
            # Map COCO class to item category
            category = 'BAGS' if det['class'] in ['suitcase', 'backpack', 'handbag'] else 'CONTAINER'
            
            # Calculate coordinates for location description
            x1, y1, x2, y2 = det['bbox']
            center_x = (x1 + x2) / 2
            center_y = (y1 + y2) / 2
            
            # Prepare image data for upload
            try:
                with open(abs_image_path, 'rb') as img_file:
                    img_data = img_file.read()
                print(f"📦 Read image file: {len(img_data)} bytes")
            except Exception as e:
                print(f"❌ Error reading image file: {e}")
                return False
            
            # First, upload the image
            files = {'file': (f"{det['class']}.jpg", img_data, 'image/jpeg')}
            upload_url = "http://localhost:8082/api/files/detection/upload"
            print(f"📤 Uploading image to: {upload_url}")
            
            try:
                upload_response = requests.post(upload_url, files=files)
                print(f"📥 Upload response status: {upload_response.status_code}")
                print(f"📥 Upload response text: {upload_response.text}")
                upload_response.raise_for_status()
            except requests.exceptions.RequestException as e:
                print(f"❌ Error uploading image: {e}")
                if hasattr(e.response, 'text'):
                    print(f"Response text: {e.response.text}")
                return False
            
            # Get the image URL from response
            image_url = upload_response.text.strip('"')
            print(f"🔗 Got image URL: {image_url}")
            
            # Prepare data for API
            data = {
                'name': f"Detected {det['class']}",
                'description': f"Automatically detected {det['class']} with confidence {det['score']:.2f}",
                'category': category,
                'status': "LOST",
                'type': "LOST",
                'location': f"Camera Feed (X:{center_x:.1f}, Y:{center_y:.1f})",
                'imageUrl': image_url,
                'reportedAt': datetime.now().isoformat()
            }

            headers = {'Content-Type': 'application/json'}
            print(f"📤 Creating item with data: {data}")

            # Create item in database
            try:
                response = requests.post(api_url, json=data, headers=headers)
                print(f"📥 Create item response status: {response.status_code}")
                print(f"📥 Create item response text: {response.text}")
                
                if response.status_code in (200, 201):
                    print(f"✅ Saved detection to database: {data['name']}")
                    return True
                else:
                    print(f"❌ Failed to save detection: {response.status_code}")
                    print(f"Response: {response.text}")
                    return False
            except requests.exceptions.RequestException as e:
                print(f"❌ Error creating item: {e}")
                if hasattr(e.response, 'text'):
                    print(f"Response text: {e.response.text}")
                return False
        
        except Exception as e:
            print(f"❌ Error saving to database: {e}")
            import traceback
            traceback.print_exc()
            return False

    def get_class_names(self):
        """Get list of class names"""
        return [
            'background',
            'suitcase', 'backpack', 'bag', 'handbag', 'briefcase',  # Luggage items
            'person', 'human',  # People
            'chair', 'bench', 'seat',  # Furniture
            'table', 'desk',  # Surfaces
            'door', 'window',  # Building elements
            'wall', 'floor',  # Structures
            'light', 'lamp',  # Lighting
            'plant', 'tree',  # Nature
            'car', 'vehicle',  # Vehicles
            'bicycle', 'motorcycle',  # Two-wheelers
            'trash', 'bin',  # Waste
            'sign', 'poster',  # Information
            'clock', 'watch',  # Time
            'phone', 'laptop',  # Electronics
            'book', 'newspaper',  # Reading material
            'food', 'drink'  # Consumables
        ]

    def is_stationary(self, obj_id, current_position, current_time):
        """Check if an object is stationary"""
        obj_data = self.tracked_objects[obj_id]
        
        if obj_data['last_position'] is None:
            obj_data['first_seen'] = current_time
            obj_data['last_position'] = current_position
            obj_data['last_seen'] = current_time
            return False
            
        # Calculate distance moved
        last_x, last_y = obj_data['last_position']
        current_x, current_y = current_position
        distance = ((current_x - last_x) ** 2 + (current_y - last_y) ** 2) ** 0.5
        
        # Check if enough time has passed since last detection
        if obj_data['last_detection_time'] is not None:
            time_since_last = (current_time - obj_data['last_detection_time']).total_seconds()
            if time_since_last < self.min_detection_interval:
                return False
        
        # Update tracking data
        obj_data['last_position'] = current_position
        obj_data['last_seen'] = current_time
        obj_data['last_detection_time'] = current_time
        
        # Consider stationary if moved less than threshold
        return distance < self.max_tracking_distance

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Lost Object Detection Service')
    parser.add_argument('--model', required=True, help='Path to the YOLOv5 model file')
    parser.add_argument('--video', help='Path to video file (optional)')
    parser.add_argument('--output', help='Path to save output video (optional)')
    parser.add_argument('--no-backend', action='store_true', help='Disable backend integration')
    parser.add_argument('--camera-id', type=int, help='Camera ID for live detection')
    parser.add_argument('--camera-location', help='Location description for camera feed')
    
    args = parser.parse_args()
    
    # Initialize detector
    detector = ObjectDetector(model_path=args.model)
    
    # Process video or camera feed
    if args.camera_id is not None:
        detector.process_video(
            args.camera_id,
            output_path=args.output,
            save_to_db=not args.no_backend,
            location=args.camera_location
        )
    elif args.video:
        detector.process_video(
            args.video,
            output_path=args.output,
            save_to_db=not args.no_backend
        )
    else:
        print("Please provide either --video or --camera-id") 