#!/usr/bin/env python3
"""
Unified Detection API - Consolidated and Secure
Replaces the fragmented detection system with a single, well-structured API
"""

import os
import logging
import traceback
import uuid
import time
import tempfile
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path

import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import torch
from ultralytics import YOLO

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('unified_detection.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DetectionConfig:
    """Configuration management for the detection service"""
    
    def __init__(self):
        self.model_path = os.getenv('YOLO_MODEL_PATH', 'yolov8n.pt')
        self.confidence_threshold = float(os.getenv('CONFIDENCE_THRESHOLD', '0.5'))
        self.max_file_size = int(os.getenv('MAX_FILE_SIZE', '50')) * 1024 * 1024  # 50MB default
        self.temp_dir = os.getenv('TEMP_DIR', tempfile.gettempdir())
        self.max_processing_time = int(os.getenv('MAX_PROCESSING_TIME', '60'))  # seconds
        
        # Category mapping from YOLO classes to application categories
        self.category_mapping = {
            'handbag': 'BAGS',
            'backpack': 'BAGS',
            'suitcase': 'BAGS',
            'cell phone': 'ELECTRONICS',
            'laptop': 'ELECTRONICS',
            'mouse': 'ELECTRONICS',
            'keyboard': 'ELECTRONICS',
            'book': 'BOOKS',
            'bottle': 'MISCELLANEOUS',
            'cup': 'MISCELLANEOUS',
            'umbrella': 'ACCESSORIES',
            'tie': 'CLOTHING',
            'scissors': 'MISCELLANEOUS',
            'teddy bear': 'TOYS',
            'hair drier': 'ELECTRONICS',
            'toothbrush': 'MISCELLANEOUS'
        }

class UnifiedDetector:
    """Unified object detection class using YOLO"""
    
    def __init__(self, config: DetectionConfig):
        self.config = config
        self.model = None
        self.load_model()
        
    def load_model(self):
        """Load YOLO model with error handling"""
        try:
            # Temporarily disable PyTorch weights_only for YOLO compatibility
            import torch
            original_load = torch.load
            torch.load = lambda *args, **kwargs: original_load(*args, **kwargs, weights_only=False)
            
            if not os.path.exists(self.config.model_path):
                logger.warning(f"Model file {self.config.model_path} not found. Downloading default model...")
                self.model = YOLO('yolov8n.pt')  # Download if not exists
            else:
                self.model = YOLO(self.config.model_path)
                
            # Restore original torch.load
            torch.load = original_load
            logger.info(f"Model loaded successfully: {self.config.model_path}")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise
    
    def detect_objects(self, image_path: str) -> List[Dict[str, Any]]:
        """
        Detect objects in an image
        
        Args:
            image_path: Path to the image file
            
        Returns:
            List of detection results
        """
        try:
            start_time = time.time()
            
            # Temporarily disable PyTorch weights_only for YOLO inference
            import torch
            original_load = torch.load
            torch.load = lambda *args, **kwargs: original_load(*args, **kwargs, weights_only=False)
            
            try:
                # Run inference
                results = self.model(image_path, conf=self.config.confidence_threshold)
            finally:
                # Restore original torch.load
                torch.load = original_load
            
            detections = []
            for result in results:
                for box in result.boxes:
                    # Extract detection data
                    xyxy = box.xyxy[0].cpu().numpy()
                    confidence = float(box.conf[0])
                    class_id = int(box.cls[0])
                    class_name = self.model.names[class_id]
                    
                    # Map to application category
                    category = self.config.category_mapping.get(class_name, 'MISCELLANEOUS')
                    
                    detection = {
                        'object_id': str(uuid.uuid4()),
                        'class': class_name,
                        'category': category,
                        'confidence': confidence,
                        'bbox': [int(x) for x in xyxy],  # [x1, y1, x2, y2]
                        'timestamp': datetime.now().isoformat()
                    }
                    detections.append(detection)
            
            processing_time = time.time() - start_time
            logger.info(f"Detected {len(detections)} objects in {processing_time:.2f}s")
            
            return detections
            
        except Exception as e:
            logger.error(f"Detection failed: {e}")
            raise
    
    def process_video(self, video_path: str, frame_skip: int = 30) -> List[Dict[str, Any]]:
        """
        Process video file for object detection
        
        Args:
            video_path: Path to video file
            frame_skip: Process every Nth frame to improve performance
            
        Returns:
            List of unique detections across all frames
        """
        try:
            cap = cv2.VideoCapture(video_path)
            all_detections = []
            frame_count = 0
            processed_frames = 0
            
            while cap.read()[0]:
                frame_count += 1
                if frame_count % frame_skip != 0:
                    continue
                
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_count - 1)
                ret, frame = cap.read()
                
                if not ret:
                    break
                
                # Save frame temporarily
                temp_frame_path = os.path.join(
                    self.config.temp_dir, 
                    f"frame_{frame_count}_{uuid.uuid4().hex[:8]}.jpg"
                )
                
                try:
                    cv2.imwrite(temp_frame_path, frame)
                    frame_detections = self.detect_objects(temp_frame_path)
                    
                    # Add frame information
                    for detection in frame_detections:
                        detection['frame_number'] = frame_count
                        detection['frame_timestamp'] = frame_count / cap.get(cv2.CAP_PROP_FPS)
                    
                    all_detections.extend(frame_detections)
                    processed_frames += 1
                    
                finally:
                    # Clean up temporary frame
                    if os.path.exists(temp_frame_path):
                        os.remove(temp_frame_path)
            
            cap.release()
            
            # Remove duplicate detections based on spatial and temporal proximity
            unique_detections = self._remove_duplicate_detections(all_detections)
            
            logger.info(f"Processed {processed_frames} frames, found {len(unique_detections)} unique objects")
            return unique_detections
            
        except Exception as e:
            logger.error(f"Video processing failed: {e}")
            raise

    def _remove_duplicate_detections(self, detections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate detections based on IoU and class similarity"""
        if not detections:
            return []
        
        # Simple deduplication based on class and spatial overlap
        unique_detections = []
        
        for detection in detections:
            is_duplicate = False
            
            for existing in unique_detections:
                # Check if same class and overlapping bounding boxes
                if (detection['class'] == existing['class'] and 
                    self._calculate_iou(detection['bbox'], existing['bbox']) > 0.5):
                    is_duplicate = True
                    # Keep the one with higher confidence
                    if detection['confidence'] > existing['confidence']:
                        unique_detections.remove(existing)
                        unique_detections.append(detection)
                    break
            
            if not is_duplicate:
                unique_detections.append(detection)
        
        return unique_detections
    
    def _capture_object_screenshot(self, video_path: str, detection: Dict[str, Any]) -> str:
        """Capture a screenshot of the detected object from the video frame"""
        try:
            import cv2
            import os
            from datetime import datetime
            
            # Get frame number from detection
            frame_number = detection.get('frame_number', 0)
            bbox = detection.get('bbox', [0, 0, 0, 0])
            object_class = detection.get('class', 'unknown')
            
            # Open video
            cap = cv2.VideoCapture(video_path)
            
            # Jump to the specific frame
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
            ret, frame = cap.read()
            
            if not ret:
                cap.release()
                return None
            
            # Extract bounding box coordinates
            x, y, w, h = bbox
            
            # Add some padding around the object (10% on each side)
            padding = 20
            x = max(0, x - padding)
            y = max(0, y - padding)
            w = min(frame.shape[1] - x, w + 2 * padding)
            h = min(frame.shape[0] - y, h + 2 * padding)
            
            # Crop the object from the frame
            cropped_object = frame[y:y+h, x:x+w]
            
            # Create screenshots directory in the Spring backend uploads folder
            backend_uploads_dir = os.path.join('..', 'spring-backend', 'uploads', 'detected-objects')
            os.makedirs(backend_uploads_dir, exist_ok=True)
            
            # Generate unique filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            screenshot_filename = f"{object_class}_{timestamp}_{frame_number}.jpg"
            screenshot_path = os.path.join(backend_uploads_dir, screenshot_filename)
            
            # Save the cropped image
            cv2.imwrite(screenshot_path, cropped_object)
            
            cap.release()
            
            logger.info(f"📸 Captured screenshot: {screenshot_path}")
            return screenshot_path
            
        except Exception as e:
            logger.error(f"Failed to capture screenshot: {e}")
            return None
    
    def _calculate_iou(self, box1: List[int], box2: List[int]) -> float:
        """Calculate Intersection over Union (IoU) of two bounding boxes"""
        x1, y1, x2, y2 = box1
        x1_p, y1_p, x2_p, y2_p = box2
        
        # Calculate intersection
        xi1 = max(x1, x1_p)
        yi1 = max(y1, y1_p)
        xi2 = min(x2, x2_p)
        yi2 = min(y2, y2_p)
        
        if xi2 <= xi1 or yi2 <= yi1:
            return 0.0
        
        intersection = (xi2 - xi1) * (yi2 - yi1)
        
        # Calculate union
        area1 = (x2 - x1) * (y2 - y1)
        area2 = (x2_p - x1_p) * (y2_p - y1_p)
        union = area1 + area2 - intersection
        
        return intersection / union if union > 0 else 0.0

# Flask application
app = Flask(__name__)
CORS(app)

# Initialize configuration and detector
config = DetectionConfig()
detector = UnifiedDetector(config)

# Session storage (in production, use Redis or database)
sessions = {}

def validate_file(file) -> Optional[str]:
    """Validate uploaded file"""
    if not file or not file.filename:
        return "No file provided"
    
    if file.content_length and file.content_length > config.max_file_size:
        return f"File too large. Maximum size: {config.max_file_size // (1024*1024)}MB"
    
    filename = secure_filename(file.filename)
    if not filename:
        return "Invalid filename"
    
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.mp4', '.avi', '.mov', '.mkv'}
    if not any(filename.lower().endswith(ext) for ext in allowed_extensions):
        return "Unsupported file format"
    
    return None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test model availability
        model_status = "loaded" if detector.model is not None else "not_loaded"
        
        return jsonify({
            'status': 'healthy',
            'model_status': model_status,
            'timestamp': datetime.now().isoformat(),
            'version': '1.0.0'
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/detect/image', methods=['POST'])
def detect_image():
    """Process single image for object detection"""
    try:
        # Check if file is in request
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        error = validate_file(file)
        if error:
            return jsonify({'error': error}), 400
        
        # Save uploaded file temporarily
        filename = secure_filename(file.filename)
        temp_path = os.path.join(config.temp_dir, f"{uuid.uuid4().hex}_{filename}")
        
        try:
            file.save(temp_path)
            
            # Run detection
            detections = detector.detect_objects(temp_path)
            
            session_id = str(uuid.uuid4())
            result = {
                'session_id': session_id,
                'total_objects': len(detections),
                'detections': detections,
                'processing_time': time.time(),
                'status': 'success'
            }
            
            # Store session data
            sessions[session_id] = result
            
            return jsonify(result)
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        logger.error(f"Image detection error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': 'Internal server error',
            'details': str(e),
            'status': 'error',
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/detect/video', methods=['POST'])
def detect_video():
    """Process video file for object detection"""
    try:
        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided'}), 400
        
        file = request.files['video']
        error = validate_file(file)
        if error:
            return jsonify({'error': error}), 400
        
        # Save uploaded file temporarily
        filename = secure_filename(file.filename)
        temp_path = os.path.join(config.temp_dir, f"{uuid.uuid4().hex}_{filename}")
        
        try:
            file.save(temp_path)
            
            # Get frame skip parameter (default: every 30th frame)
            frame_skip = int(request.form.get('frame_skip', 30))
            
            # Run detection
            detections = detector.process_video(temp_path, frame_skip)
            
            session_id = str(uuid.uuid4())
            result = {
                'session_id': session_id,
                'total_objects': len(detections),
                'detections': detections,
                'processing_time': time.time(),
                'status': 'success'
            }
            
            # Store session data
            sessions[session_id] = result
            
            return jsonify(result)
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        logger.error(f"Video detection error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': 'Internal server error',
            'details': str(e),
            'status': 'error',
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/detect/strict', methods=['POST'])
def detect_strict():
    """Process video with strict detection (main objects only, filtered)"""
    try:
        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided'}), 400
        
        file = request.files['video']
        error = validate_file(file)
        if error:
            return jsonify({'error': error}), 400
        
        # Save uploaded file temporarily
        filename = secure_filename(file.filename)
        temp_path = os.path.join(config.temp_dir, f"{uuid.uuid4().hex}_{filename}")
        
        try:
            file.save(temp_path)
            
            # Use stricter frame skip for better accuracy (every 15th frame)
            frame_skip = int(request.form.get('frame_skip', 15))
            
            # Run detection with stricter filtering
            all_detections = detector.process_video(temp_path, frame_skip)
            
            # Apply strict filtering - only main objects, no small parts
            strict_detections = []
            main_object_classes = ['handbag', 'backpack', 'suitcase', 'cell phone', 'laptop', 'book', 'bottle', 'umbrella']
            
            for detection in all_detections:
                if detection.get('class') in main_object_classes:
                    # Additional confidence filtering for strict mode
                    if detection.get('confidence', 0) >= 0.7:  # Higher confidence threshold
                        strict_detections.append(detection)
            
            # Remove duplicates more aggressively for strict mode
            filtered_detections = detector._remove_duplicate_detections(strict_detections)
            
            # Format response to match expected structure and capture screenshots
            objects = []
            for i, detection in enumerate(filtered_detections):
                # Generate screenshot for this detection
                screenshot_path = detector._capture_object_screenshot(temp_path, detection)
                
                obj = {
                    'id': f"strict_{i}_{detection.get('class', 'unknown')}",
                    'category': config.category_mapping.get(detection.get('class', ''), 'MISCELLANEOUS'),
                    'confidence': detection.get('confidence', 0),
                    'bbox': detection.get('bbox', [0, 0, 0, 0]),
                    'class': detection.get('class', 'unknown'),
                    'frame_number': detection.get('frame_number', 0),
                    'timestamp': detection.get('timestamp', 0),
                    'screenshot_path': screenshot_path
                }
                objects.append(obj)
            
            result = {
                'success': True,
                'objects': objects,
                'total_objects': len(objects),
                'processing_mode': 'strict',
                'filters_applied': ['main_objects_only', 'high_confidence', 'duplicate_removal'],
                'timestamp': datetime.now().isoformat()
            }
            
            return jsonify(result)
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        logger.error(f"Strict detection error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'details': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/session/<session_id>/results', methods=['GET'])
def get_session_results(session_id: str):
    """Get results for a specific session"""
    if session_id not in sessions:
        return jsonify({'error': 'Session not found'}), 404
    
    return jsonify(sessions[session_id])

@app.route('/models', methods=['GET'])
def get_models():
    """Get available detection models"""
    return jsonify({
        'models': ['yolov8n.pt', 'yolov8s.pt', 'yolov8m.pt', 'yolov8l.pt'],
        'current_model': config.model_path,
        'categories': list(config.category_mapping.values())
    })

@app.route('/configure', methods=['POST'])
def configure_detection():
    """Configure detection parameters"""
    try:
        data = request.get_json()
        
        if 'confidence_threshold' in data:
            threshold = float(data['confidence_threshold'])
            if 0.0 <= threshold <= 1.0:
                config.confidence_threshold = threshold
            else:
                return jsonify({'error': 'Confidence threshold must be between 0 and 1'}), 400
        
        return jsonify({
            'message': 'Configuration updated successfully',
            'current_config': {
                'confidence_threshold': config.confidence_threshold,
                'model_path': config.model_path,
                'max_file_size': config.max_file_size
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'File too large'}), 413

@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5002))
    debug = os.getenv('DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting Unified Detection API on port {port}")
    logger.info(f"Debug mode: {debug}")
    logger.info(f"Model: {config.model_path}")
    logger.info(f"Confidence threshold: {config.confidence_threshold}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)