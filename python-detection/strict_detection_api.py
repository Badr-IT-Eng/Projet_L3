#!/usr/bin/env python3
"""
🎯 ROBUST DETECTION API
API endpoint for robust lost object detection - détecte tous types d'objets perdus
avec filtrage intelligent et classification automatique
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import logging
import os
import tempfile
import base64
import cv2
import numpy as np
import requests
import json
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
            
            # Additional validation for common misclassifications
            category = _validate_and_correct_classification(class_name, category, conf)
            
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
        
        # Save detected objects to database if any unattended objects found
        db_save_result = None
        if objects_detected and len(objects_detected) > 0:
            # Save image with detections marked
            saved_image_path = _save_detection_image(image, objects_detected, image_file.filename)
            db_save_result = _save_detections_to_database(objects_detected, image_file.filename, saved_image_path)
        
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
            },
            'database_save': db_save_result
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

def _validate_and_correct_classification(class_name, category, confidence):
    """
    COMPREHENSIVE YOLO class validation and correction
    Fixes ALL naming problems and misclassifications
    """
    class_name_lower = class_name.lower()
    
    # COMPLETE YOLO CLASSES MAPPING - Based on YOLO v8 80 classes
    yolo_class_mapping = {
        # === LOST ITEMS CATEGORIES ===
        
        # BAGS & LUGGAGE
        'suitcase': 'BAGS',
        'handbag': 'BAGS', 
        'backpack': 'BAGS',
        'umbrella': 'BAGS',  # Often carried with bags
        
        # ELECTRONICS  
        'cell phone': 'ELECTRONICS',
        'laptop': 'ELECTRONICS',
        'mouse': 'ELECTRONICS',
        'remote': 'ELECTRONICS',
        'keyboard': 'ELECTRONICS',
        'tv': 'ELECTRONICS',
        'microwave': 'ELECTRONICS',
        'toaster': 'ELECTRONICS',
        'hair drier': 'ELECTRONICS',
        
        # PERSONAL ITEMS
        'book': 'PERSONAL',
        'scissors': 'PERSONAL',
        'teddy bear': 'PERSONAL',
        'hair drier': 'PERSONAL',
        'toothbrush': 'PERSONAL',
        
        # CLOTHING & ACCESSORIES
        'tie': 'CLOTHING',
        
        # SPORTS & RECREATION
        'sports ball': 'PERSONAL',
        'baseball bat': 'PERSONAL',
        'baseball glove': 'PERSONAL',
        'skateboard': 'PERSONAL',
        'surfboard': 'PERSONAL',
        'tennis racket': 'PERSONAL',
        'frisbee': 'PERSONAL',
        'skis': 'PERSONAL',
        'snowboard': 'PERSONAL',
        'kite': 'PERSONAL',
        
        # MISCELLANEOUS LOST ITEMS
        'bottle': 'MISCELLANEOUS',
        'wine glass': 'MISCELLANEOUS',
        'cup': 'MISCELLANEOUS',
        'fork': 'MISCELLANEOUS',
        'knife': 'MISCELLANEOUS',
        'spoon': 'MISCELLANEOUS',
        'bowl': 'MISCELLANEOUS',
        'banana': 'MISCELLANEOUS',
        'apple': 'MISCELLANEOUS',
        'sandwich': 'MISCELLANEOUS',
        'orange': 'MISCELLANEOUS',
        'broccoli': 'MISCELLANEOUS',
        'carrot': 'MISCELLANEOUS',
        'hot dog': 'MISCELLANEOUS',
        'pizza': 'MISCELLANEOUS',
        'donut': 'MISCELLANEOUS',
        'cake': 'MISCELLANEOUS',
        'clock': 'MISCELLANEOUS',
        'vase': 'MISCELLANEOUS',
        
        # === EXCLUDED CLASSES (NOT LOST ITEMS) ===
        
        # PEOPLE
        'person': 'EXCLUDED',
        
        # ANIMALS (Often confused with bags/objects)
        'bird': 'EXCLUDED',
        'cat': 'EXCLUDED',        # Often confused with bags!
        'dog': 'EXCLUDED',        # Often confused with bags!
        'horse': 'EXCLUDED',
        'sheep': 'EXCLUDED', 
        'cow': 'EXCLUDED',
        'elephant': 'EXCLUDED',
        'bear': 'EXCLUDED',       # Often confused with teddy bears
        'zebra': 'EXCLUDED',
        'giraffe': 'EXCLUDED',
        
        # VEHICLES
        'bicycle': 'EXCLUDED',
        'car': 'EXCLUDED', 
        'motorbike': 'EXCLUDED',
        'aeroplane': 'EXCLUDED',
        'bus': 'EXCLUDED',
        'train': 'EXCLUDED',
        'truck': 'EXCLUDED',
        'boat': 'EXCLUDED',
        
        # TRAFFIC & INFRASTRUCTURE  
        'traffic light': 'EXCLUDED',
        'fire hydrant': 'EXCLUDED',
        'stop sign': 'EXCLUDED',
        'parking meter': 'EXCLUDED',
        
        # FURNITURE & FIXTURES
        'bench': 'EXCLUDED',
        'chair': 'EXCLUDED',
        'couch': 'EXCLUDED', 
        'potted plant': 'EXCLUDED',
        'bed': 'EXCLUDED',
        'dining table': 'EXCLUDED',
        'toilet': 'EXCLUDED',
        'sink': 'EXCLUDED',
        'refrigerator': 'EXCLUDED',
        'oven': 'EXCLUDED',
    }
    
    # Direct mapping from YOLO class name
    if class_name_lower in yolo_class_mapping:
        mapped_category = yolo_class_mapping[class_name_lower]
        if mapped_category == 'EXCLUDED':
            logger.info(f"🚫 EXCLUDED: {class_name} - not a lost item")
            return 'EXCLUDED'
        else:
            logger.info(f"✅ MAPPED: {class_name} → {mapped_category}")
            return mapped_category
    
    # Special confidence-based validation for problematic classes
    if class_name_lower in ['cat', 'dog'] and confidence < 0.85:
        logger.warning(f"⚠️ Low confidence {class_name} ({confidence:.2f}) - likely bag misclassification, EXCLUDING")
        return 'EXCLUDED'
    
    # Check for partial matches in class names
    for yolo_class, mapped_cat in yolo_class_mapping.items():
        if yolo_class in class_name_lower or class_name_lower in yolo_class:
            if mapped_cat == 'EXCLUDED':
                logger.info(f"🚫 PARTIAL MATCH EXCLUDED: {class_name} matches {yolo_class}")
                return 'EXCLUDED'
            else:
                logger.info(f"✅ PARTIAL MATCH: {class_name} matches {yolo_class} → {mapped_cat}")
                return mapped_cat
    
    # If we get here, it's an unknown class - be conservative and exclude
    logger.warning(f"❓ UNKNOWN CLASS: {class_name} - excluding for safety")
    return 'EXCLUDED'

def _save_detection_image(image, objects_detected, original_filename):
    """
    Save image with detected objects marked with bounding boxes
    
    Args:
        image: OpenCV image
        objects_detected: List of detected objects
        original_filename: Original image filename
    
    Returns:
        str: Path to saved image or None if failed
    """
    try:
        # Create a copy of the image for marking
        marked_image = image.copy()
        
        # Draw bounding boxes for detected objects
        for obj in objects_detected:
            bbox = obj['bbox']
            x1, y1, x2, y2 = bbox
            
            # Choose color based on category
            color_map = {
                'BAGS': (0, 255, 0),      # Green for bags
                'ELECTRONICS': (255, 0, 0),  # Blue for electronics
                'CLOTHING': (0, 165, 255),    # Orange for clothing
                'PERSONAL': (255, 0, 255),    # Magenta for personal items
                'MISCELLANEOUS': (128, 128, 128)  # Gray for misc
            }
            color = color_map.get(obj['category'], (0, 255, 0))
            
            # Draw rectangle
            cv2.rectangle(marked_image, (int(x1), int(y1)), (int(x2), int(y2)), color, 3)
            
            # Add label
            label = f"{obj['class']} {int(obj['confidence']*100)}%"
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)[0]
            cv2.rectangle(marked_image, (int(x1), int(y1-30)), (int(x1+label_size[0]), int(y1)), color, -1)
            cv2.putText(marked_image, label, (int(x1), int(y1-10)), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        # Create output directory if it doesn't exist
        output_dir = "detected_objects"
        os.makedirs(output_dir, exist_ok=True)
        
        # Generate unique filename
        import time
        timestamp = int(time.time() * 1000)
        base_name = os.path.splitext(original_filename)[0]
        output_filename = f"{base_name}_detected_{timestamp}.jpg"
        output_path = os.path.join(output_dir, output_filename)
        
        # Save marked image
        success = cv2.imwrite(output_path, marked_image)
        
        if success:
            logger.info(f"📸 Saved detection image: {output_path}")
            return output_path
        else:
            logger.error(f"❌ Failed to save detection image: {output_path}")
            return None
            
    except Exception as e:
        logger.error(f"❌ Error saving detection image: {str(e)}")
        return None

def _save_detections_to_database(objects_detected, filename, image_path=None):
    """
    Save detected unattended objects to database via Next.js API
    
    Args:
        objects_detected: List of detected objects
        filename: Original image filename
    
    Returns:
        dict: Save operation result
    """
    try:
        saved_count = 0
        saved_objects = []
        errors = []
        
        # Save each detected object individually
        for obj in objects_detected:
            # Category mapping from detection to lost-objects format
            category_mapping = {
                'BAGS': 'bags',
                'ELECTRONICS': 'electronics', 
                'CLOTHING': 'clothing',
                'PERSONAL': 'accessories',
                'MISCELLANEOUS': 'other'
            }
            
            # Determine image URL
            image_url = '/placeholder.svg'  # Default
            if image_path:
                # Convert local path to URL accessible by frontend
                image_filename = os.path.basename(image_path)
                image_url = f'http://localhost:5002/static/detected_objects/{image_filename}'
            
            # Prepare data in the format expected by lost-objects API
            save_data = {
                'name': f"{obj['class'].capitalize()} détecté automatiquement",
                'description': f"Objet détecté par IA: {obj['class']} avec {round(obj['confidence']*100)}% de confiance. Détection automatique par caméra de surveillance. Statut: non surveillé. Coordonnées de détection: [{obj['bbox'][0]}, {obj['bbox'][1]}, {obj['bbox'][2]}, {obj['bbox'][3]}]",
                'category': category_mapping.get(obj['category'], 'other'),
                'location': 'Caméra de surveillance - Position détectée automatiquement',
                'coordinates': {
                    'lat': 43.2965,  # Default to Marseille coordinates
                    'lng': 5.3698
                },
                'image': image_url,  # Use saved detection image
                'contactInformation': 'admin@recovr.com', # System contact
                'date': '2025-06-27',
                'time': '12:00'
            }
        
            # Call Next.js API to save to database (use lost-objects endpoint which handles auth)
            nextjs_api_url = 'http://localhost:3000/api/lost-objects'
            
            try:
                response = requests.post(
                    nextjs_api_url,
                    json=save_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get('success'):
                        saved_count += 1
                        saved_objects.append(result.get('object', {}))
                        logger.info(f"✅ Successfully saved {obj['class']} to database")
                    else:
                        errors.append(f"Failed to save {obj['class']}: {result.get('error', 'Unknown error')}")
                else:
                    errors.append(f"Failed to save {obj['class']}: HTTP {response.status_code}")
                    logger.error(f"❌ Failed to save {obj['class']}: {response.status_code} - {response.text}")
                    
            except requests.exceptions.RequestException as e:
                errors.append(f"Network error saving {obj['class']}: {str(e)}")
                logger.error(f"❌ Network error saving {obj['class']}: {str(e)}")
        
        # Return overall result
        return {
            'success': True,
            'saved_objects': saved_count,
            'total_objects': len(objects_detected),
            'message': f'Processed {len(objects_detected)} objects, saved {saved_count}',
            'objects': saved_objects,
            'errors': errors if errors else None
        }
            
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Network error saving to database: {str(e)}")
        return {
            'success': False,
            'error': f'Network error: {str(e)}'
        }
    except Exception as e:
        logger.error(f"❌ Unexpected error saving to database: {str(e)}")
        return {
            'success': False,
            'error': f'Unexpected error: {str(e)}'
        }

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

@app.route('/static/detected_objects/<filename>')
def serve_detected_image(filename):
    """Serve detected object images"""
    try:
        return send_from_directory('detected_objects', filename)
    except Exception as e:
        logger.error(f"❌ Error serving image {filename}: {str(e)}")
        return jsonify({'error': 'Image not found'}), 404

@app.route('/test/classification/<class_name>')
def test_classification(class_name):
    """Test classification mapping for a specific YOLO class name"""
    try:
        if not detector:
            return jsonify({'error': 'Detector not available'}), 500
        
        # Test the original detector mapping
        original_category = detector._map_category(class_name)
        
        # Test the enhanced validation
        enhanced_category = _validate_and_correct_classification(class_name, original_category, 0.7)
        
        return jsonify({
            'success': True,
            'input_class': class_name,
            'original_mapping': original_category,
            'enhanced_mapping': enhanced_category,
            'confidence_test': 0.7,
            'final_result': enhanced_category,
            'will_be_detected': enhanced_category not in ['EXCLUDED'],
            'mapping_info': {
                'BAGS': 'Sacs, valises, sacs à dos',
                'ELECTRONICS': 'Téléphones, ordinateurs, souris', 
                'CLOTHING': 'Vêtements, chaussures, cravates',
                'PERSONAL': 'Livres, jouets, objets personnels',
                'MISCELLANEOUS': 'Bouteilles, ustensiles, horloges',
                'EXCLUDED': 'Animaux, personnes, véhicules, meubles'
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Classification test failed: {str(e)}")
        return jsonify({'error': f'Test failed: {str(e)}'}), 500

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