#!/usr/bin/env python3
"""
Test detection with authentication bypass
"""
import requests
import json
import tempfile
import cv2
import numpy as np

def create_suitcase_video():
    """Create a video with a clear suitcase"""
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(temp_file.name, fourcc, 30.0, (640, 480))
    
    for i in range(90):  # 3 seconds
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        
        # Draw a realistic suitcase
        # Main body (brown/black)
        cv2.rectangle(frame, (200, 200), (440, 350), (50, 30, 20), -1)
        
        # Handle (metallic)
        cv2.rectangle(frame, (290, 180), (350, 200), (200, 200, 200), -1)
        
        # Wheels
        cv2.circle(frame, (220, 340), 8, (100, 100, 100), -1)
        cv2.circle(frame, (420, 340), 8, (100, 100, 100), -1)
        
        # Zipper line
        cv2.line(frame, (200, 275), (440, 275), (150, 150, 150), 2)
        
        out.write(frame)
    
    out.release()
    return temp_file.name

def test_direct_spring_backend():
    """Test Spring backend directly bypassing authentication"""
    print("🧪 Testing Spring Backend Detection...")
    
    video_path = create_suitcase_video()
    
    try:
        # Try to call the detection endpoint directly
        with open(video_path, 'rb') as video_file:
            files = {'video': ('suitcase_test.mp4', video_file, 'video/mp4')}
            
            # Add headers that might help
            headers = {
                'User-Agent': 'Mozilla/5.0 (Test)',
            }
            
            print(f"📹 Sending video: {video_path}")
            print(f"📏 File size: {video_file.seek(0, 2)} bytes")
            video_file.seek(0)
            
            response = requests.post(
                'http://localhost:8082/api/admin/detection/strict',
                files=files,
                headers=headers,
                timeout=120
            )
        
        print(f"📊 Response Status: {response.status_code}")
        print(f"📝 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 401:
            print("🔐 Authentication required (normal)")
            return False
        elif response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Response: {json.dumps(result, indent=2)}")
            return True
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False
    finally:
        import os
        os.unlink(video_path)

def test_python_api_with_real_suitcase():
    """Test Python API with realistic suitcase video"""
    print("\n🧪 Testing Python API with realistic suitcase...")
    
    video_path = create_suitcase_video()
    
    try:
        with open(video_path, 'rb') as video_file:
            files = {'video': ('suitcase_test.mp4', video_file, 'video/mp4')}
            
            print(f"📹 Sending video: {video_path}")
            response = requests.post(
                'http://localhost:5002/detect/strict',
                files=files,
                timeout=120
            )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ API Response: {json.dumps(result, indent=2)}")
            
            if result.get('objects'):
                print(f"🎯 Objects detected: {len(result['objects'])}")
                for obj in result['objects']:
                    print(f"   - {obj.get('category')}: {obj.get('confidence', 0)*100:.1f}%")
            else:
                print("❌ No objects detected")
            
            return len(result.get('objects', [])) > 0
        else:
            print(f"❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False
    finally:
        import os
        os.unlink(video_path)

def check_frontend_button():
    """Check if there's a simple way to test frontend"""
    print("\n🧪 Frontend Button Analysis...")
    print("💡 To test the frontend button manually:")
    print("   1. Open browser DevTools (F12)")
    print("   2. Go to Console tab")
    print("   3. Paste this code:")
    print("""
// Test the detection function directly
const fileInput = document.querySelector('input[type="file"]');
const button = document.querySelector('button[contains="Strict Detection"]');

console.log('File input:', fileInput);
console.log('Detection button:', button);
console.log('Selected file:', fileInput?.files[0]);

// Try to trigger detection manually
if (window.processVideo) {
    console.log('processVideo function exists');
} else {
    console.log('processVideo function not found');
}
""")
    print("   4. Check what it outputs")

def main():
    print("🔧 COMPREHENSIVE DETECTION DEBUG")
    print("=" * 50)
    
    # Test Python API first
    python_works = test_python_api_with_real_suitcase()
    
    # Test Spring backend
    spring_works = test_direct_spring_backend()
    
    # Frontend guidance
    check_frontend_button()
    
    print("\n📋 SUMMARY:")
    print("=" * 30)
    print(f"Python API: {'✅ Working' if python_works else '❌ Issue'}")
    print(f"Spring Backend: {'✅ Working' if spring_works else '🔐 Auth Required'}")
    
    if python_works and not spring_works:
        print("\n💡 LIKELY ISSUE: Authentication")
        print("   The frontend button probably fails because you're not logged in as admin")
        print("   OR there's a CORS/session issue")
        
    elif not python_works:
        print("\n💡 LIKELY ISSUE: Detection Algorithm")
        print("   The detection is too strict - no objects being found")
        
    else:
        print("\n💡 LIKELY ISSUE: Frontend JavaScript")
        print("   Check browser console for errors")

if __name__ == "__main__":
    main()