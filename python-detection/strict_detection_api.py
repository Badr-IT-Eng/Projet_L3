#!/usr/bin/env python3
"""
🎯 ROBUST DETECTION API
API endpoint for robust lost object detection - détecte tous types d'objets perdus
avec filtrage intelligent et classification automatique
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
import tempfile
import base64
import cv2
import numpy as np
from strict_suitcase_detector import StrictSuitcaseDetector

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Initialize robust detector
try:
    detector = StrictSuitcaseDetector(confidence_threshold=0.05)
    logger.info("✅ Strict Suitcase Detector initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize detector: {e}")
    detector = None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'strict_detection_api',
        'version': '1.0.0'
    })

@app.route('/detect/strict', methods=['POST'])
def detect_strict():
    """
    Strict detection endpoint - only returns main suitcase object
    Ignores small parts like handles, zippers, etc.
    """
    try:
        logger.info("🎯 Received strict detection request")
        
        # Check if video file was uploaded
        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided'}), 400
        
        video_file = request.files['video']
        if video_file.filename == '':
            return jsonify({'error': 'No video file selected'}), 400
        
        # Validate file type
        allowed_extensions = {'.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv'}
        file_extension = os.path.splitext(video_file.filename.lower())[1]
        
        if file_extension not in allowed_extensions:
            return jsonify({'error': f'Unsupported video format: {file_extension}. Supported formats: {", ".join(allowed_extensions)}'}), 400
        
        # Save uploaded video temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_video:
            video_file.save(temp_video.name)
            temp_video_path = temp_video.name
        
        logger.info(f"📹 Processing video: {video_file.filename}")
        logger.info(f"📁 Temp file size: {os.path.getsize(temp_video_path)} bytes")
        
        # Check if detector is available
        if not detector:
            return jsonify({'error': 'Detection model not available'}), 500
        
        # Run strict suitcase detection
        detection_result = detector.detect_main_suitcase(temp_video_path)
        
        # Convert result for API response
        api_response = {
            'success': True,
            'method': 'strict_suitcase_detection',
            'processing_info': {
                'filename': video_file.filename,
                'detection_method': 'Strict Suitcase Detection',
                'total_detections': 1 if detection_result['detection_result']['object_found'] else 0,
                'categories_detected': ['BAGS'] if detection_result['detection_result']['object_found'] else []
            }
        }
        
        if detection_result['detection_result']['object_found']:
            detected_obj = detection_result['suitcase']
            
            # Convert cropped image to base64 (try multiple paths for compatibility)
            cropped_image_path = None
            for path in ['strict_detections/robust_object_detection.jpg', 
                        'strict_detections/strict_object_detection.jpg']:
                if os.path.exists(path):
                    cropped_image_path = path
                    break
            
            img_url = None
            if cropped_image_path:
                try:
                    with open(cropped_image_path, 'rb') as img_file:
                        img_data = img_file.read()
                        img_base64 = base64.b64encode(img_data).decode('utf-8')
                        img_url = f"data:image/jpeg;base64,{img_base64}"
                except Exception as e:
                    logger.error(f"❌ Failed to encode image: {e}")
            
            # Parse confidence (handle both percentage string and float)
            confidence = detected_obj['confidence']
            if isinstance(confidence, str) and '%' in confidence:
                confidence_value = float(confidence.replace('%', '')) / 100
            else:
                confidence_value = float(confidence)
            
            api_response['objects'] = [{
                'id': f'robust_object_{detected_obj["frame_number"]:03d}',
                'category': detected_obj['category'],
                'class_name': detected_obj.get('class_name', 'unknown'),
                'confidence': confidence_value,
                'bbox': detected_obj['bounding_box'],
                'timestamp': detected_obj['found_at_time'],
                'frame_number': detected_obj['frame_number'],
                'cropped_image_url': img_url,
                'detection_score': float(detected_obj['score'].replace('%', '')) if isinstance(detected_obj['score'], str) else float(detected_obj['score']),
                'priority': detected_obj.get('priority', '0.5'),
                'detection_notes': f'{detected_obj.get("class_name", "Object")} detected with robust filtering'
            }]
            api_response['total_objects'] = 1
            
            logger.info(f"✅ Robust detection successful: {detected_obj['confidence']} confidence, category: {detected_obj['category']}")
        else:
            api_response['objects'] = []
            api_response['total_objects'] = 0
            api_response['message'] = 'No objects detected with robust filtering'
            
            logger.warning("⚠️ No objects detected with robust filtering")
        
        # Cleanup temp file
        os.unlink(temp_video_path)
        
        return jsonify(api_response)
        
    except Exception as e:
        logger.error(f"❌ Strict detection failed: {str(e)}")
        
        # Cleanup temp file if it exists
        if 'temp_video_path' in locals():
            try:
                os.unlink(temp_video_path)
            except:
                pass
        
        return jsonify({
            'success': False,
            'error': f'Detection failed: {str(e)}',
            'method': 'strict_suitcase_detection'
        }), 500

@app.route('/detect/info', methods=['GET'])
def detection_info():
    """Get information about the strict detection service"""
    return jsonify({
        'service': 'Strict Suitcase Detection API',
        'version': '1.0.0',
        'features': {
            'single_object_focus': 'Only detects the main suitcase object',
            'component_filtering': 'Ignores handles, zippers, small parts',
            'context_cropping': 'Maximum context padding (200%) for clear visibility',
            'category_mapping': 'Maps train/luggage/bag detections to BAGS category',
            'strict_validation': 'Multiple size, position, and ratio checks'
        },
        'supported_formats': ['mp4', 'avi', 'mov'],
        'endpoints': {
            '/health': 'Health check',
            '/detect/strict': 'Strict suitcase detection (POST with video file)',
            '/detect/info': 'Service information'
        }
    })

if __name__ == '__main__':
    print("🎯 ROBUST DETECTION API STARTING")
    print("=" * 50)
    print("✅ Multi-category object detection")
    print("🚫 Intelligent filtering")
    print("🖼️ Context-aware cropping")
    print("📊 Smart classification")
    print("🌐 CORS enabled")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=5002, debug=True)