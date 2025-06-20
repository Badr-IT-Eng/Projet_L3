#!/usr/bin/env python3
"""
Simple runner for Smart Lost Object Detection
Usage: python run_detection.py <video_file>
"""

import sys
import os
from smart_lost_object_detector import SmartLostObjectDetector
from config import get_detection_config

def main():
    if len(sys.argv) < 2:
        print("❌ Usage: python run_detection.py <video_file>")
        print("📝 Example: python run_detection.py my_video.mp4")
        return
    
    video_file = sys.argv[1]
    
    if not os.path.exists(video_file):
        print(f"❌ Video file not found: {video_file}")
        return
    
    print("🚀 Smart Lost Object Detection")
    print("=" * 50)
    print(f"📹 Video: {video_file}")
    print("🔧 Settings: Optimized for minimal zoom, maximum accuracy")
    print("🎯 Target: Only ACTUALLY lost items (no false positives)")
    print("=" * 50)
    
    # Get configuration
    config = get_detection_config()
    
    # Initialize detector with smart settings
    detector = SmartLostObjectDetector(
        confidence_threshold=config['confidence_threshold'],
        zoom_padding=config['zoom_padding']
    )
    
    try:
        # Run detection
        results = detector.process_video_stream(video_file)
        
        # Display results
        print("\n📊 DETECTION RESULTS")
        print("=" * 50)
        print(f"✅ Total lost items found: {results['total_detections']}")
        
        if results['total_detections'] > 0:
            print(f"📦 Categories found: {', '.join(results['categories_found'])}")
            print(f"🎯 High confidence items: {len(results['high_confidence_items'])}")
            print(f"⚠️  Likely abandoned: {len(results['likely_abandoned'])}")
            
            print("\n📋 DETAILED DETECTIONS:")
            for i, detection in enumerate(results['detections'], 1):
                print(f"  {i}. {detection['category']} - {detection['confidence']:.1%} confidence")
                print(f"     Context: {detection['context']}")
                print(f"     Abandonment score: {detection['abandonment_score']:.1%}")
                print(f"     Image: {detection['cropped_image_path']}")
                print()
        
        # Save report
        import json
        report_file = f"detection_report_{int(os.path.basename(video_file).split('.')[0])}.json"
        with open(report_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"📄 Full report saved to: {report_file}")
        print("\n✅ Detection completed successfully!")
        
    except Exception as e:
        print(f"❌ Detection failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)