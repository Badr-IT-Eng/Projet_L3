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

@app.route('/detect/image', methods=['POST'])
def detect_image():
    """
    Image detection endpoint for real-time camera frames
    """
    try:
        logger.info("🖼️ Received image detection request")
        
        # Check if image file was uploaded
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        image_file = request.files['image']
        if image_file.filename == '':
            return jsonify({'error': 'No image file selected'}), 400
        
        # Validate file type
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}
        file_extension = os.path.splitext(image_file.filename.lower())[1]
        
        if file_extension not in allowed_extensions:
            return jsonify({'error': f'Unsupported image format: {file_extension}. Supported formats: {", ".join(allowed_extensions)}'}), 400
        
        # Check if detector is available
        if not detector:
            return jsonify({'error': 'Detection model not available'}), 500
        
        # Read image data
        image_data = image_file.read()
        
        # Convert to OpenCV format
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return jsonify({'error': 'Invalid image data'}), 400
        
        logger.info(f"📷 Processing image: {image_file.filename} ({image.shape})")
        
        # Run detection on single frame
        detections = detector.model(image, conf=detector.confidence_threshold, verbose=False)
        
        # Process detections
        all_detections = []
        people_detections = []
        
        if len(detections) > 0 and len(detections[0].boxes) > 0:
            for box in detections[0].boxes:
                conf = float(box.conf[0])
                class_id = int(box.cls[0])
                class_name = detector.model.names[class_id]
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                
                detection_obj = {
                    'class': class_name,
                    'confidence': conf,
                    'bbox': [int(x1), int(y1), int(x2), int(y2)]
                }
                
                # Separate people from objects
                if class_name.lower() == 'person':
                    people_detections.append(detection_obj)
                else:
                    all_detections.append(detection_obj)
        
        # Filter objects that are NOT near people (lost objects logic)
        objects_detected = []
        
        for obj_detection in all_detections:
            class_name = obj_detection['class']
            conf = obj_detection['confidence']
            bbox = obj_detection['bbox']
            
            # Apply category mapping
            category = detector._map_category(class_name)
            
            # Enhanced filtering: exclude people, furniture, vehicles and apply confidence thresholds
            min_confidence = {
                'BAGS': 0.5,           # Higher threshold for bags - better precision
                'ELECTRONICS': 0.6,    # Higher threshold for electronics
                'CLOTHING': 0.6,       # Higher threshold for clothing  
                'PERSONAL': 0.7,       # Higher threshold for personal items
                'MISCELLANEOUS': 0.7   # Higher threshold for misc items
            }
            
            # Check if object meets confidence and category requirements
            if (category != 'EXCLUDED' and 
                category in min_confidence and 
                conf >= min_confidence[category]):
                
                # Check if object is near a person (not lost if near person)
                is_near_person = _is_object_near_person(bbox, people_detections, image.shape[:2])
                
                if not is_near_person:  # Only add if NOT near a person (truly lost)
                    logger.info(f"✅ Object {class_name} is ALONE - marking as potentially lost")
                    objects_detected.append({
                        'category': category,
                        'class': class_name,
                        'confidence': conf,
                        'bbox': bbox,
                        'source': 'yolo_realtime',
                        'context': 'unattended'  # Object is unattended
                    })
                else:
                    logger.info(f"⚠️ Object {class_name} is near person - NOT marking as lost")
            else:
                if category == 'EXCLUDED':
                    logger.debug(f"🚫 Excluded {class_name} from detection")
                else:
                    logger.debug(f"❌ {class_name} failed confidence threshold ({conf:.3f} < {min_confidence.get(category, 0.5)})")
        
        logger.info(f"🎯 Detected {len(objects_detected)} objects")
        
        # Return detection results
        return jsonify({
            'success': True,
            'method': 'realtime_image_detection',
            'objects': objects_detected,
            'total_objects': len(objects_detected),
            'categories': list(set(obj['category'] for obj in objects_detected)),
            'processing_info': {
                'filename': image_file.filename,
                'detection_method': 'YOLO Real-time Detection + Proximity Analysis',
                'image_size': f"{image.shape[1]}x{image.shape[0]}",
                'people_detected': len(people_detections),
                'total_objects_found': len(all_detections),
                'objects_near_people': len(all_detections) - len(objects_detected),
                'unattended_objects': len(objects_detected)
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Image detection failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Detection failed: {str(e)}',
            'method': 'realtime_image_detection'
        }), 500

def _is_object_near_person(object_bbox, people_detections, image_size):
    """
    Check if an object is near a person (within proximity threshold)
    
    Args:
        object_bbox: [x1, y1, x2, y2] bounding box of the object
        people_detections: List of person detection objects with bbox
        image_size: (height, width) of the image
    
    Returns:
        bool: True if object is near a person, False if object is alone/lost
    """
    if not people_detections:
        return False  # No people detected, object is alone
    
    obj_x1, obj_y1, obj_x2, obj_y2 = object_bbox
    obj_center_x = (obj_x1 + obj_x2) / 2
    obj_center_y = (obj_y1 + obj_y2) / 2
    obj_width = obj_x2 - obj_x1
    obj_height = obj_y2 - obj_y1
    
    # Dynamic proximity threshold based on image size and object size
    img_height, img_width = image_size
    base_threshold = min(img_width, img_height) * 0.2  # 20% of image dimension
    object_size_factor = max(obj_width, obj_height) * 2  # 2x object size
    proximity_threshold = max(base_threshold, object_size_factor)
    
    logger.debug(f"🔍 Checking proximity: object at ({obj_center_x:.0f}, {obj_center_y:.0f}), threshold: {proximity_threshold:.0f}px")
    
    for person in people_detections:
        person_bbox = person['bbox']
        person_conf = person['confidence']
        
        # Only consider high-confidence person detections
        if person_conf < 0.5:
            continue
            
        p_x1, p_y1, p_x2, p_y2 = person_bbox
        person_center_x = (p_x1 + p_x2) / 2
        person_center_y = (p_y1 + p_y2) / 2
        
        # Calculate distance between object and person centers
        distance = ((obj_center_x - person_center_x) ** 2 + (obj_center_y - person_center_y) ** 2) ** 0.5
        
        logger.debug(f"👤 Person at ({person_center_x:.0f}, {person_center_y:.0f}), distance: {distance:.0f}px")
        
        # Check if object is within proximity of this person
        if distance <= proximity_threshold:
            logger.info(f"🤝 Object is within {distance:.0f}px of person (threshold: {proximity_threshold:.0f}px) - ATTENDED")
            return True
    
    logger.info(f"🏃 Object is alone - no person within {proximity_threshold:.0f}px - UNATTENDED")
    return False

@app.route('/detect', methods=['POST'])
def detect_generic():
    """
    Generic detection endpoint that handles both images and videos
    """
    try:
        # Check for image first
        if 'image' in request.files:
            return detect_image()
        elif 'video' in request.files:
            return detect_strict()
        else:
            return jsonify({'error': 'No image or video file provided'}), 400
    except Exception as e:
        logger.error(f"❌ Generic detection failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Detection failed: {str(e)}',
            'method': 'generic_detection'
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
            'strict_validation': 'Multiple size, position, and ratio checks',
            'realtime_detection': 'Real-time camera frame detection'
        },
        'supported_formats': {
            'video': ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv'],
            'image': ['jpg', 'jpeg', 'png', 'webp', 'bmp']
        },
        'endpoints': {
            '/health': 'Health check',
            '/detect/strict': 'Strict suitcase detection (POST with video file)',
            '/detect/image': 'Real-time image detection (POST with image file)',
            '/detect': 'Generic detection (POST with image or video file)',
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