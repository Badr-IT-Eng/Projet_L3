#!/usr/bin/env python3
"""
Test script to verify the video detection pipeline
"""

import requests
import json
import tempfile
import os
import cv2
import numpy as np

def create_test_video():
    """Create a simple test video with a rectangle (simulating a suitcase)"""
    # Create a temporary video file
    temp_video = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False)
    temp_video.close()
    
    # Video properties
    width, height = 640, 480
    fps = 30
    duration = 3  # seconds
    total_frames = fps * duration
    
    # Create video writer
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(temp_video.name, fourcc, fps, (width, height))
    
    for frame_num in range(total_frames):
        # Create a black frame
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        
        # Draw a suitcase-like rectangle (brown/tan color)
        suitcase_color = (101, 67, 33)  # Brown color in BGR
        
        # Position and size of the "suitcase"
        x, y = 200, 300
        w, h = 180, 120
        
        # Draw the main suitcase body
        cv2.rectangle(frame, (x, y), (x + w, y + h), suitcase_color, -1)
        
        # Add some details to make it look more like a suitcase
        # Handle
        cv2.rectangle(frame, (x + w//2 - 10, y - 15), (x + w//2 + 10, y - 5), (50, 50, 50), -1)
        
        # Corner reinforcements
        cv2.rectangle(frame, (x, y), (x + 20, y + 20), (80, 50, 20), -1)
        cv2.rectangle(frame, (x + w - 20, y), (x + w, y + 20), (80, 50, 20), -1)
        cv2.rectangle(frame, (x, y + h - 20), (x + 20, y + h), (80, 50, 20), -1)
        cv2.rectangle(frame, (x + w - 20, y + h - 20), (x + w, y + h), (80, 50, 20), -1)
        
        # Zipper line
        cv2.line(frame, (x + 10, y + h//2), (x + w - 10, y + h//2), (40, 40, 40), 2)
        
        out.write(frame)
    
    out.release()
    print(f"✅ Created test video: {temp_video.name}")
    return temp_video.name

def test_python_api_direct():
    """Test the Python detection API directly"""
    print("\n🔍 Testing Python Detection API directly...")
    
    # Create test video
    video_path = create_test_video()
    
    try:
        # Test health endpoint
        health_response = requests.get('http://localhost:5002/health')
        print(f"Health check: {health_response.status_code}")
        print(f"Health response: {health_response.json()}")
        
        # Test detection endpoint
        with open(video_path, 'rb') as video_file:
            files = {'video': video_file}
            detection_response = requests.post('http://localhost:5002/detect/strict', files=files)
        
        print(f"Detection status: {detection_response.status_code}")
        if detection_response.status_code == 200:
            result = detection_response.json()
            print(f"Detection success: {result.get('success', False)}")
            print(f"Objects found: {result.get('total_objects', 0)}")
            if result.get('objects'):
                for obj in result['objects']:
                    print(f"  - {obj['category']}: {obj['confidence']:.1%} confidence")
        else:
            print(f"Detection error: {detection_response.text}")
            
    except Exception as e:
        print(f"❌ Error testing Python API: {e}")
    finally:
        # Cleanup
        if os.path.exists(video_path):
            os.unlink(video_path)
            print(f"🗑️ Cleaned up test video")

def test_spring_backend_api():
    """Test the Spring Boot backend API"""
    print("\n🔍 Testing Spring Boot Backend API...")
    
    # Create test video
    video_path = create_test_video()
    
    try:
        # Test health endpoint
        health_response = requests.get('http://localhost:8082/api/detection/health')
        print(f"Backend health: {health_response.status_code}")
        print(f"Backend health response: {health_response.json()}")
        
        # Test admin strict detection endpoint
        # Note: This would require authentication in a real scenario
        with open(video_path, 'rb') as video_file:
            files = {'video': video_file}
            # For testing purposes, we'll try without authentication first
            detection_response = requests.post('http://localhost:8082/api/admin/detection/strict', files=files)
        
        print(f"Backend detection status: {detection_response.status_code}")
        if detection_response.status_code == 200:
            result = detection_response.json()
            print(f"Backend detection success: {result.get('success', False)}")
        elif detection_response.status_code == 401:
            print("🔐 Authentication required (expected)")
        else:
            print(f"Backend detection error: {detection_response.text}")
            
    except Exception as e:
        print(f"❌ Error testing Spring Backend: {e}")
    finally:
        # Cleanup
        if os.path.exists(video_path):
            os.unlink(video_path)
            print(f"🗑️ Cleaned up test video")

def test_integration():
    """Test the full integration"""
    print("\n🔍 Testing Full Integration...")
    
    # Test if all services are running
    services = [
        ("Python Detection API", "http://localhost:5002/health"),
        ("Spring Backend", "http://localhost:8082/api/detection/health"),
        ("Frontend", "http://localhost:3000")
    ]
    
    for service_name, url in services:
        try:
            response = requests.get(url, timeout=5)
            status = "✅ Running" if response.status_code == 200 else f"⚠️ Status {response.status_code}"
            print(f"{service_name:25}: {status}")
        except requests.exceptions.RequestException as e:
            print(f"{service_name:25}: ❌ Not accessible ({e})")

if __name__ == "__main__":
    print("🎯 LOST OBJECT DETECTION PIPELINE TEST")
    print("=" * 50)
    
    test_integration()
    test_python_api_direct()
    test_spring_backend_api()
    
    print("\n✅ Pipeline testing complete!")
    print("\n📋 SUMMARY:")
    print("- Python Detection API should be running on port 5002")
    print("- Spring Backend should be running on port 8082") 
    print("- Frontend should be running on port 3000")
    print("- To fix authentication issues, admin login is required in the frontend")