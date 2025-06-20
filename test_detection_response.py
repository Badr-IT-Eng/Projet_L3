#!/usr/bin/env python3
"""
Test the detection API response format
"""
import requests
import json
import sys

def test_detection_api():
    """Test detection API directly"""
    api_url = "http://localhost:5002/detect/strict"
    
    # Test with a sample video (create a minimal test file)
    test_video_path = "/tmp/test_video.mp4"
    
    # Create a minimal MP4 file for testing
    import cv2
    import numpy as np
    
    # Create a simple test video with a rectangle (simulating an object)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(test_video_path, fourcc, 30.0, (640, 480))
    
    for i in range(30):  # 1 second of video
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        # Draw a rectangle (simulating a bag/object)
        cv2.rectangle(frame, (200, 150), (400, 350), (255, 255, 255), -1)
        out.write(frame)
    
    out.release()
    
    # Test the API
    try:
        with open(test_video_path, 'rb') as video_file:
            files = {'video': video_file}
            response = requests.post(api_url, files=files, timeout=60)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            response_data = response.json()
            print("\n🎉 SUCCESS! API Response:")
            print(json.dumps(response_data, indent=2, default=str))
            
            # Check if objects were detected
            if 'objects' in response_data and response_data['objects']:
                print(f"\n✅ Detected {len(response_data['objects'])} object(s)")
                for i, obj in enumerate(response_data['objects']):
                    print(f"  Object {i+1}: {obj.get('category', 'Unknown')} ({obj.get('confidence', 0)*100:.1f}% confidence)")
            else:
                print("\n❌ No objects detected")
        else:
            print(f"\n❌ API Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
    
    # Cleanup
    import os
    if os.path.exists(test_video_path):
        os.remove(test_video_path)

if __name__ == "__main__":
    test_detection_api()