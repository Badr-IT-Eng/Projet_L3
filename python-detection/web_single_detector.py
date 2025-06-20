#!/usr/bin/env python3
"""
🎯 WEB-OPTIMIZED SINGLE OBJECT DETECTOR
Returns exactly 1 detection result for web interface integration
Perfect for your suitcase detection use case
"""

import sys
sys.path.append('.')
from single_object_detector import SingleObjectDetector
import json
import os

def detect_single_object_for_web(video_path: str, output_dir: str = "detections") -> dict:
    """
    Web-optimized detection that returns exactly 1 best object
    
    Args:
        video_path: Path to the video file
        output_dir: Directory to save detection images
    
    Returns:
        Single detection result in web-compatible format
    """
    
    # Initialize detector with optimal settings for single object
    detector = SingleObjectDetector(confidence_threshold=0.15)  # Lower threshold to catch more objects
    
    try:
        # Run detection
        results = detector.detect_single_object(video_path)
        
        if results['detection_result']['object_found']:
            best = results['best_detection']
            
            # Create output directory
            os.makedirs(output_dir, exist_ok=True)
            
            # Save the detection image with a standard name
            output_image = os.path.join(output_dir, "best_detection.jpg")
            
            # Copy the best detection image 
            import cv2
            import shutil
            detection_data = results.get('best_detection')
            if detection_data and 'cropped_image' in detection_data:
                # Save the cropped image directly
                cv2.imwrite(output_image, detection_data['cropped_image'])
            else:
                # Try to copy from the single_detections folder
                source_image = "single_detections/single_object_detection.jpg"
                if os.path.exists(source_image):
                    shutil.copy2(source_image, output_image)
            
            # Return web-compatible result
            web_result = {
                "success": True,
                "detection": {
                    "category": best['category'],
                    "confidence": float(best['confidence'].rstrip('%')) / 100,  # Convert "89.4%" to 0.894
                    "confidence_percentage": best['confidence'],
                    "position": {
                        "x": best['bounding_box'][0],
                        "y": best['bounding_box'][1], 
                        "width": best['bounding_box'][2],
                        "height": best['bounding_box'][3]
                    },
                    "timestamp": best['found_at_time'],
                    "frame_number": best['frame_number'],
                    "image_path": output_image,
                    "total_score": float(best['total_score'])
                },
                "metadata": {
                    "method": "single_object_focused_detection",
                    "frames_analyzed": results['detection_result']['total_frames_analyzed'],
                    "video_path": video_path,
                    "processing_time": results['video_info']['processing_time']
                }
            }
            
            return web_result
            
        else:
            return {
                "success": False,
                "error": "No suitable object detected in the video",
                "metadata": {
                    "method": "single_object_focused_detection", 
                    "frames_analyzed": results['detection_result']['total_frames_analyzed'],
                    "video_path": video_path
                }
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Detection failed: {str(e)}",
            "metadata": {
                "video_path": video_path
            }
        }

def main():
    """
    Test the web-optimized detector
    """
    print("🎯 WEB-OPTIMIZED SINGLE OBJECT DETECTOR")
    print("=" * 50)
    
    # Test with the suitcase video
    video_path = '../copied_services/python-services/detection-service/output.mp4'
    
    print(f"📹 Processing: {video_path}")
    result = detect_single_object_for_web(video_path)
    
    if result['success']:
        detection = result['detection']
        print(f"\n✅ SUCCESS - Found 1 object:")
        print(f"   📦 Category: {detection['category']}")
        print(f"   🎯 Confidence: {detection['confidence_percentage']}")
        print(f"   📍 Position: ({detection['position']['x']}, {detection['position']['y']})")
        print(f"   📏 Size: {detection['position']['width']}x{detection['position']['height']}")
        print(f"   ⏱️  Time: {detection['timestamp']}")
        print(f"   📁 Image: {detection['image_path']}")
        print(f"   🏆 Score: {detection['total_score']:.3f}")
        
        print(f"\n📊 Analysis:")
        print(f"   Frames analyzed: {result['metadata']['frames_analyzed']}")
        print(f"   Method: {result['metadata']['method']}")
        
        print(f"\n🎊 Perfect! Your web interface will now get exactly 1 detection result!")
        
    else:
        print(f"\n❌ Detection failed: {result['error']}")
    
    # Save result for web integration
    with open("web_detection_result.json", "w") as f:
        json.dump(result, f, indent=2, default=str)
    
    print(f"\n📄 Web result saved: web_detection_result.json")

if __name__ == "__main__":
    main()