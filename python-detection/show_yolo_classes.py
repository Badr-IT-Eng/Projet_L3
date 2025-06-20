#!/usr/bin/env python3
"""
Show all YOLO classes to find bag-related ones
"""
from ultralytics import YOLO

def show_yolo_classes():
    """Show all YOLO classes"""
    model = YOLO('yolov8n.pt')
    
    print("🏷️ ALL YOLO CLASSES:")
    print("=" * 50)
    
    for class_id, class_name in model.names.items():
        print(f"{class_id:2d}: {class_name}")
    
    print("\n🎒 BAG-RELATED CLASSES:")
    print("=" * 30)
    bag_keywords = ['bag', 'suitcase', 'luggage', 'backpack', 'handbag']
    
    for class_id, class_name in model.names.items():
        if any(keyword in class_name.lower() for keyword in bag_keywords):
            print(f"{class_id:2d}: {class_name} ⭐")

if __name__ == "__main__":
    show_yolo_classes()