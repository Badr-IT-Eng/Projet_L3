#!/usr/bin/env python3
"""
Test script to verify the integration between the model and backend
"""

import requests
import json
import os
import time
import cv2
import torch
from datetime import datetime
from object_detector import ObjectDetector

API_BASE_URL = "http://localhost:8082/api"
TEST_VIDEO = "20250615_034055.mp4"

def get_jwt_token():
    """Get JWT token for authentication"""
    try:
        response = requests.post(
            f"{API_BASE_URL}/auth/signin",
            json={
                "username": "admin2",
                "password": "admin123"
            }
        )
        if response.status_code == 200:
            return response.json().get('token')
        return None
    except Exception as e:
        print(f"❌ Failed to get JWT token: {e}")
        return None

def get_headers():
    """Get headers with JWT token"""
    token = get_jwt_token()
    return {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    } if token else {}

def test_backend_connection():
    """Test if the backend is running"""
    try:
        response = requests.get(f"{API_BASE_URL}/test/ping", headers=get_headers())
        if response.status_code == 200:
            print("✅ Backend is running")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Backend returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to backend: {e}")
        return False

def test_file_upload():
    """Test file upload functionality"""
    try:
        # Create a dummy image file for testing
        test_image_path = "test_image.jpg"
        
        # Create a simple test image (1x1 pixel JPEG)
        import io
        from PIL import Image
        
        img = Image.new('RGB', (100, 100), color='red')
        img.save(test_image_path, 'JPEG')
        
        # Upload the file
        with open(test_image_path, 'rb') as f:
            files = {'file': ('test_image.jpg', f, 'image/jpeg')}
            headers = {'Authorization': f'Bearer {get_jwt_token()}'} if get_jwt_token() else {}
            response = requests.post(f"{API_BASE_URL}/files/upload", files=files, headers=headers)
        
        # Clean up
        if os.path.exists(test_image_path):
            os.remove(test_image_path)
        
        if response.status_code == 200:
            file_url = response.text.strip('"')
            print("✅ File upload works")
            print(f"   File URL: {file_url}")
            return file_url
        else:
            print(f"❌ File upload failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ File upload error: {e}")
        return None

def test_detection_session():
    """Test detection session management"""
    try:
        # Start session
        start_url = f"{API_BASE_URL}/detection/sessions/start"
        params = {
            'cameraId': 'test_camera_001',
            'cameraLocation': 'Test Location',
            'modelVersion': 'test_model_v1'
        }
        
        response = requests.post(start_url, params=params)
        
        if response.status_code == 200:
            session_data = response.json()
            session_id = session_data.get('sessionId')
            print("✅ Detection session started")
            print(f"   Session ID: {session_id}")
            
            # End session
            end_url = f"{API_BASE_URL}/detection/sessions/{session_id}/end"
            end_response = requests.post(end_url)
            
            if end_response.status_code == 200:
                print("✅ Detection session ended successfully")
                return True
            else:
                print(f"❌ Failed to end session: {end_response.status_code}")
                return False
                
        else:
            print(f"❌ Failed to start detection session: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Detection session error: {e}")
        return False

def test_detection_processing():
    """Test detection data processing"""
    try:
        # Start session first
        start_url = f"{API_BASE_URL}/detection/sessions/start"
        params = {
            'cameraId': 'test_camera_002',
            'cameraLocation': 'Test Location 2',
            'modelVersion': 'test_model_v1'
        }
        
        session_response = requests.post(start_url, params=params)
        if session_response.status_code != 200:
            print("❌ Could not start session for detection test")
            return False
        
        session_id = session_response.json().get('sessionId')
        
        # Upload a test image first
        file_url = test_file_upload()
        if not file_url:
            print("❌ Could not upload test image for detection")
            return False
        
        # Send detection data
        process_url = f"{API_BASE_URL}/detection/process"
        detection_data = {
            'sessionId': session_id,
            'trackingId': 'test_track_001',
            'category': 'ELECTRONICS',
            'confidence': 0.85,
            'x': 100,
            'y': 150,
            'width': 200,
            'height': 300,
            'snapshotUrl': file_url
        }
        
        response = requests.post(process_url, json=detection_data, 
                               headers={'Content-Type': 'application/json'})
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Detection processing works")
            print(f"   Result: {result}")
            
            # End session
            end_url = f"{API_BASE_URL}/detection/sessions/{session_id}/end"
            requests.post(end_url)
            
            return True
        else:
            print(f"❌ Detection processing failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Detection processing error: {e}")
        return False

def test_detection_queries():
    """Test detection query endpoints"""
    try:
        # Test abandoned objects
        response = requests.get(f"{API_BASE_URL}/detection/abandoned")
        if response.status_code == 200:
            abandoned = response.json()
            print(f"✅ Abandoned objects query works ({len(abandoned)} objects)")
        else:
            print(f"❌ Abandoned objects query failed: {response.status_code}")
        
        # Test recent detections
        response = requests.get(f"{API_BASE_URL}/detection/recent?hoursBack=24")
        if response.status_code == 200:
            recent = response.json()
            print(f"✅ Recent detections query works ({len(recent)} detections)")
        else:
            print(f"❌ Recent detections query failed: {response.status_code}")
        
        # Test stats
        response = requests.get(f"{API_BASE_URL}/detection/stats")
        if response.status_code == 200:
            stats = response.json()
            print("✅ Detection stats query works")
            print(f"   Total detections: {stats.get('totalDetections', 'N/A')}")
        else:
            print(f"❌ Detection stats query failed: {response.status_code}")
        
        return True
        
    except Exception as e:
        print(f"❌ Detection queries error: {e}")
        return False

def find_stable_models():
    """Find all stable model files in the directory."""
    model_files = []
    for file in os.listdir('.'):
        if file.endswith('.pt'):  # Changed from .pth to .pt
            model_files.append(file)
    return sorted(model_files)

def test_yolo_with_backend():
    """Test YOLOv8 model with backend integration"""
    try:
        # Find the latest model
        model_files = sorted([f for f in os.listdir('.') if f.endswith('.pt')])
        if not model_files:
            print("❌ No YOLOv8 models found!")
            return False
        
        latest_model = model_files[-1]
        print(f"📦 Using model: {latest_model}")
        
        # Initialize detector
        detector = ObjectDetector(latest_model)
        
        # Start detection session
        session_response = requests.post(
            f"{API_BASE_URL}/detection/sessions/start",
            params={
                'cameraId': 'test_camera_001',
                'cameraLocation': 'Test Location',
                'modelVersion': latest_model
            },
            headers=get_headers()
        )
        
        if session_response.status_code != 200:
            print("❌ Failed to start detection session")
            return False
        
        session_id = session_response.json().get('sessionId')
        print(f"✅ Started detection session: {session_id}")
        
        # Process video
        cap = cv2.VideoCapture(TEST_VIDEO)
        frame_count = 0
        detections_sent = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            frame_count += 1
            if frame_count % 30 != 0:  # Process every 30th frame
                continue
                
            # Detect objects
            results = detector.detect(frame)
            
            # Send detections to backend
            for det in results:
                # Save detection snapshot
                snapshot_path = f"snapshots/det_{frame_count}_{detections_sent}.jpg"
                os.makedirs('snapshots', exist_ok=True)
                cv2.imwrite(snapshot_path, frame)
                
                # Upload snapshot
                with open(snapshot_path, 'rb') as f:
                    files = {'file': (os.path.basename(snapshot_path), f, 'image/jpeg')}
                    headers = {'Authorization': f'Bearer {get_jwt_token()}'} if get_jwt_token() else {}
                    upload_response = requests.post(f"{API_BASE_URL}/files/upload", files=files, headers=headers)
                
                if upload_response.status_code != 200:
                    print(f"❌ Failed to upload snapshot: {upload_response.status_code}")
                    continue
                
                snapshot_url = upload_response.text.strip('"')
                
                # Send detection data
                detection_data = {
                    'sessionId': session_id,
                    'trackingId': f"track_{frame_count}_{detections_sent}",
                    'category': det['class'],
                    'confidence': float(det['confidence']),
                    'x': int(det['x']),
                    'y': int(det['y']),
                    'width': int(det['width']),
                    'height': int(det['height']),
                    'snapshotUrl': snapshot_url
                }
                
                process_response = requests.post(
                    f"{API_BASE_URL}/detection/process",
                    json=detection_data,
                    headers=get_headers()
                )
                
                if process_response.status_code == 200:
                    detections_sent += 1
                    print(f"✅ Sent detection {detections_sent}: {det['class']} ({det['confidence']:.2f})")
                else:
                    print(f"❌ Failed to process detection: {process_response.status_code}")
        
        cap.release()
        
        # End session
        end_response = requests.post(f"{API_BASE_URL}/detection/sessions/{session_id}/end", headers=get_headers())
        if end_response.status_code == 200:
            print("✅ Ended detection session")
        else:
            print(f"❌ Failed to end session: {end_response.status_code}")
        
        print(f"\n📊 Summary:")
        print(f"   Frames processed: {frame_count}")
        print(f"   Detections sent: {detections_sent}")
        
        return True
        
    except Exception as e:
        print(f"❌ YOLO test error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all integration tests"""
    print("🔍 Testing RECOVR Backend Integration")
    print("=" * 50)
    
    tests = [
        ("Backend Connection", test_backend_connection),
        ("File Upload", test_file_upload),
        ("Detection Session", test_detection_session),
        ("Detection Processing", test_detection_processing),
        ("Detection Queries", test_detection_queries),
        ("YOLO with Backend", test_yolo_with_backend),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n📋 Testing {test_name}...")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Summary:")
    passed = 0
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"   {test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nTotal: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All tests passed! Your integration is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the backend configuration and try again.")

if __name__ == "__main__":
    main()