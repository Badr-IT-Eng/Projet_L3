
        #!/usr/bin/env python3
"""
Test script to verify RECOVR Detection Service setup
"""

import sys
from pathlib import Path

def test_dependencies():
    """Test if all required Python packages are installed"""
    print("🔍 Testing Python dependencies...")
    
    required_packages = [
        ('cv2', 'OpenCV'),
        ('torch', 'PyTorch'),
        ('numpy', 'NumPy'),
        ('requests', 'Requests'),
        ('PIL', 'Pillow')
    ]
    
    missing = []
    for package, name in required_packages:
        try:
            __import__(package)
            print(f"✅ {name}")
        except ImportError:
            print(f"❌ {name} - MISSING")
            missing.append(name)
    
    if missing:
        print(f"\n❌ Missing packages: {', '.join(missing)}")
        print("Run: pip install -r requirements.txt")
        return False
    
    print("✅ All dependencies installed!")
    return True

def test_models():
    """Test if PyTorch models are available"""
    print("\n🔍 Testing PyTorch models...")
    
    models_dir = Path("../")
    model_files = list(models_dir.glob("stable_model_epoch_*.pth"))
    
    if not model_files:
        print("❌ No PyTorch models found!")
        print("Expected files like: stable_model_epoch_30.pth")
        print("Place your .pth model files in the project root")
        return False
    
    print(f"✅ Found {len(model_files)} model(s):")
    for model in sorted(model_files):
        size_mb = model.stat().st_size / (1024 * 1024)
        print(f"   📦 {model.name} ({size_mb:.1f} MB)")
    
    return True

def test_camera():
    """Test if camera is accessible"""
    print("\n🔍 Testing camera access...")
    
    try:
        import cv2
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            print("❌ Camera not accessible")
            print("Make sure no other application is using the camera")
            return False
        
        ret, frame = cap.read()
        cap.release()
        
        if ret and frame is not None:
            h, w = frame.shape[:2]
            print(f"✅ Camera working! Resolution: {w}x{h}")
            return True
        else:
            print("❌ Camera opened but can't read frames")
            return False
            
    except Exception as e:
        print(f"❌ Camera test failed: {e}")
        return False

def test_backend_connection():
    """Test connection to Spring Boot backend"""
    print("\n🔍 Testing backend API connection...")
    
    try:
        import requests
        
        # Test if backend is running
        response = requests.get("http://localhost:8080/api/detection/abandoned", timeout=5)
        
        if response.status_code == 200:
            print("✅ Backend API accessible!")
            data = response.json()
            print(f"   📊 Found {len(data) if isinstance(data, list) else 0} abandoned objects")
            return True
        elif response.status_code == 401:
            print("⚠️ Backend running but requires authentication")
            print("   API is accessible but you may need to login")
            return True
        else:
            print(f"⚠️ Backend responded with status: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend")
        print("   Make sure Spring Boot is running on port 8080")
        print("   Start with: cd spring-backend && ./gradlew bootRun")
        return False
    except Exception as e:
        print(f"❌ Backend test failed: {e}")
        return False

def test_pytorch_functionality():
    """Test basic PyTorch functionality"""
    print("\n🔍 Testing PyTorch functionality...")
    
    try:
        import torch
        import numpy as np
        
        # Test basic operations
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"   🖥️ Using device: {device}")
        
        # Test tensor operations
        x = torch.randn(1, 3, 224, 224).to(device)
        print(f"   ✅ Tensor operations working")
        
        # Test if we can load models
        models_dir = Path("../")
        model_files = list(models_dir.glob("stable_model_epoch_*.pth"))
        
        if model_files:
            latest_model = max(model_files, key=lambda x: int(x.stem.split('_')[-1]))
            try:
                model = torch.load(latest_model, map_location=device)
                print(f"   ✅ Model loading successful: {latest_model.name}")
                return True
            except Exception as e:
                print(f"   ⚠️ Model loading failed: {e}")
                print("   Model file might be corrupted or incompatible")
                return False
        else:
            print("   ⚠️ No models to test")
            return True
            
    except Exception as e:
        print(f"❌ PyTorch test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🎯 RECOVR Detection Service - Setup Test")
    print("=" * 50)
    
    tests = [
        ("Dependencies", test_dependencies),
        ("PyTorch Models", test_models),
        ("Camera Access", test_camera),
        ("Backend Connection", test_backend_connection),
        ("PyTorch Functionality", test_pytorch_functionality)
    ]
    
    results = []
    for test_name, test_func in tests:
        success = test_func()
        results.append((test_name, success))
    
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS")
    print("=" * 50)
    
    all_passed = True
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if not success:
            all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 ALL TESTS PASSED!")
        print("Your detection service is ready to run!")
        print("\nNext steps:")
        print("1. Start backend: cd spring-backend && ./gradlew bootRun")
        print("2. Start detection: python start_detection.py")
    else:
        print("⚠️ SOME TESTS FAILED")
        print("Fix the issues above before running the detection service")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 