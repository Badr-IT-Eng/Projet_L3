#!/usr/bin/env python3
"""
Test script to verify RECOVR system setup
"""

import os
import sys
import logging
from pathlib import Path
import cv2
import torch
import numpy as np
import requests
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_dependencies():
    """Test if all required dependencies are installed"""
    try:
        import cv2
        import torch
        import numpy
        import requests
        import PIL
        logger.info("✅ All dependencies are installed")
        return True
    except ImportError as e:
        logger.error(f"❌ Missing dependency: {e}")
        logger.info("Please run: pip install -r requirements.txt")
        return False

def test_camera():
    """Test if camera is accessible"""
    try:
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            logger.error("❌ Camera not accessible")
            return False
        ret, frame = cap.read()
        cap.release()
        if ret and frame is not None:
            h, w = frame.shape[:2]
            logger.info(f"✅ Camera working! Resolution: {w}x{h}")
            return True
        else:
            logger.error("❌ Camera opened but can't read frames")
            return False
    except Exception as e:
        logger.error(f"❌ Camera test failed: {e}")
        return False

def test_backend():
    """Test if backend is accessible"""
    try:
        response = requests.get("http://localhost:8082/api/health")
        if response.status_code == 200:
            logger.info("✅ Backend is accessible")
            return True
        else:
            logger.error(f"❌ Backend returned status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        logger.error("❌ Backend is not accessible")
        return False

def test_model():
    """Test if model can be loaded"""
    try:
        # Find latest model
        model_files = list(Path('.').glob('stable_model_epoch_*.pth'))
        if not model_files:
            logger.error("❌ No model files found!")
            return False
            
        model_path = max(model_files, key=lambda p: p.stat().st_mtime)
        logger.info(f"Testing model: {model_path}")
        
        # Load model
        model = torch.jit.load(model_path, map_location='cpu')
        model.eval()
        
        # Test inference
        dummy_input = torch.randn(1, 3, 640, 640)
        with torch.no_grad():
            output = model(dummy_input)
            
        logger.info("✅ Model loaded and tested successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Model test failed: {e}")
        return False

def test_file_permissions():
    """Test if required directories are writable"""
    try:
        # Test snapshots directory
        os.makedirs('snapshots', exist_ok=True)
        test_file = 'snapshots/test.txt'
        with open(test_file, 'w') as f:
            f.write('test')
        os.remove(test_file)
        
        logger.info("✅ File permissions OK")
        return True
    except Exception as e:
        logger.error(f"❌ File permission test failed: {e}")
        return False

def main():
    logger.info("=== RECOVR System Setup Test ===")
    
    tests = [
        ("Dependencies", test_dependencies),
        ("Camera", test_camera),
        ("Backend", test_backend),
        ("Model", test_model),
        ("File Permissions", test_file_permissions)
    ]
    
    all_passed = True
    for name, test_func in tests:
        logger.info(f"\nTesting {name}...")
        if not test_func():
            all_passed = False
            logger.error(f"❌ {name} test failed!")
        else:
            logger.info(f"✅ {name} test passed!")
    
    if all_passed:
        logger.info("\n✅ All tests passed! System is ready to use.")
        return 0
    else:
        logger.error("\n❌ Some tests failed. Please fix the issues before starting the system.")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 