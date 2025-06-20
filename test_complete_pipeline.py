#!/usr/bin/env python3
"""
Test the complete detection pipeline from Python API to Spring Backend
"""
import requests
import json
import os
import tempfile
import cv2
import numpy as np

def create_test_video():
    """Create a simple test video with a suitcase-like rectangle"""
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
    
    # Create video with a big rectangle (suitcase)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(temp_file.name, fourcc, 30.0, (640, 480))
    
    for i in range(60):  # 2 seconds
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        # Draw a big brown rectangle (suitcase-like)
        cv2.rectangle(frame, (200, 150), (450, 350), (101, 67, 33), -1)  # Brown color
        # Add some details to make it look more like a suitcase
        cv2.rectangle(frame, (210, 160), (440, 180), (150, 100, 50), -1)  # Handle area
        cv2.line(frame, (325, 150), (325, 350), (150, 100, 50), 3)  # Center line
        out.write(frame)
    
    out.release()
    return temp_file.name

def test_python_api():
    """Test Python detection API directly"""
    print("1. Testing Python API...")
    
    video_path = create_test_video()
    
    try:
        with open(video_path, 'rb') as video_file:
            files = {'video': video_file}
            response = requests.post('http://localhost:5002/detect/strict', files=files, timeout=60)
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"   Success: {result.get('success', False)}")
            print(f"   Objects found: {result.get('total_objects', 0)}")
            
            if result.get('objects'):
                for obj in result['objects']:
                    print(f"   - {obj.get('category', 'Unknown')}: {obj.get('confidence', 0)*100:.1f}% confidence")
            
            return True, result
        else:
            print(f"   Error: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"   Failed: {e}")
        return False, None
    finally:
        os.unlink(video_path)

def test_spring_backend():
    """Test Spring backend detection endpoint"""
    print("\n2. Testing Spring Backend API...")
    
    video_path = create_test_video()
    
    try:
        # Test without authentication first
        with open(video_path, 'rb') as video_file:
            files = {'video': video_file}
            response = requests.post('http://localhost:8082/api/admin/detection/strict', files=files, timeout=60)
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 401:
            print("   ❌ Authentication required (expected)")
            print("   💡 This is normal - admin login required")
            return True  # This is expected
        elif response.status_code == 200:
            result = response.json()
            print(f"   ✅ Success: {result}")
            return True
        else:
            print(f"   ❌ Unexpected error: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Failed: {e}")
        return False
    finally:
        os.unlink(video_path)

def test_frontend_endpoints():
    """Test if frontend is accessible"""
    print("\n3. Testing Frontend...")
    
    try:
        # Test frontend health
        response = requests.get('http://localhost:3000/', timeout=10)
        print(f"   Frontend status: {response.status_code}")
        
        # Test admin page
        response = requests.get('http://localhost:3000/admin/detection', timeout=10)
        print(f"   Admin page status: {response.status_code}")
        
        return True
    except Exception as e:
        print(f"   ❌ Frontend not accessible: {e}")
        return False

def main():
    print("🧪 COMPLETE PIPELINE TEST")
    print("=" * 50)
    
    # Test each component
    python_ok, python_result = test_python_api()
    spring_ok = test_spring_backend()
    frontend_ok = test_frontend_endpoints()
    
    print("\n📊 RESULTS:")
    print("=" * 30)
    print(f"Python API: {'✅' if python_ok else '❌'}")
    print(f"Spring Backend: {'✅' if spring_ok else '❌'}")
    print(f"Frontend: {'✅' if frontend_ok else '❌'}")
    
    if python_ok and spring_ok and frontend_ok:
        print("\n🎉 All services working!")
        print("\n💡 If button still doesn't work, check:")
        print("   1. Are you logged in as admin?")
        print("   2. Did you select a video file?")
        print("   3. Check browser console for JS errors")
        print("   4. Check browser Network tab for failed requests")
    else:
        print("\n❌ Some services have issues")
        
        if not python_ok:
            print("   🔧 Fix Python API first")
        if not spring_ok:
            print("   🔧 Check Spring Backend")
        if not frontend_ok:
            print("   🔧 Check Frontend service")

if __name__ == "__main__":
    main()