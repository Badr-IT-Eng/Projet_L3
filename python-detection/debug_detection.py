#!/usr/bin/env python3
"""
🎯 DEBUG DETECTION TOOL
Pour diagnostiquer pourquoi votre vidéo n'est plus détectée
"""

import cv2
import numpy as np
from ultralytics import YOLO
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def debug_yolo_classes():
    """Affiche toutes les classes YOLO pour voir ce qui est disponible"""
    try:
        model = YOLO('yolov8n.pt')
        print("\n🔍 CLASSES YOLO DISPONIBLES:")
        print("=" * 50)
        
        for class_id, class_name in model.names.items():
            print(f"{class_id:3d}: {class_name}")
        
        print("=" * 50)
        print(f"Total: {len(model.names)} classes\n")
        
        # Classes liées aux sacs/valises
        bag_related = []
        for class_id, class_name in model.names.items():
            if any(keyword in class_name.lower() for keyword in 
                   ['bag', 'suitcase', 'luggage', 'backpack', 'handbag', 'case']):
                bag_related.append(f"{class_id}: {class_name}")
        
        print("🎒 CLASSES LIÉES AUX SACS/VALISES:")
        for item in bag_related:
            print(f"  {item}")
        
        if not bag_related:
            print("  ❌ Aucune classe explicite pour sacs/valises trouvée")
            print("  💡 YOLO standard ne contient pas de classe 'suitcase'")
            print("  📝 Classes proches: handbag, backpack")
        
        return model
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return None

def test_detection_on_frame(model, frame_path_or_array):
    """Test la détection sur une frame spécifique"""
    try:
        if isinstance(frame_path_or_array, str):
            frame = cv2.imread(frame_path_or_array)
        else:
            frame = frame_path_or_array
            
        if frame is None:
            print("❌ Impossible de charger l'image")
            return
        
        print(f"\n🖼️ Testing detection on frame {frame.shape}")
        
        # Détection avec différents seuils
        for conf_threshold in [0.1, 0.25, 0.4, 0.6]:
            print(f"\n📊 Test avec seuil {conf_threshold}")
            results = model(frame, conf=conf_threshold, verbose=False)
            
            detections_found = False
            for result in results:
                if result.boxes is not None:
                    for box in result.boxes:
                        confidence = float(box.conf[0])
                        class_id = int(box.cls[0])
                        class_name = model.names[class_id]
                        bbox = box.xyxy[0].cpu().numpy()
                        x1, y1, x2, y2 = map(int, bbox)
                        width, height = x2 - x1, y2 - y1
                        
                        print(f"  ✅ {class_name}: {confidence:.2f} conf, size: {width}x{height}")
                        detections_found = True
            
            if not detections_found:
                print(f"  ❌ Aucune détection avec seuil {conf_threshold}")
        
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")

def debug_video_first_frames(video_path):
    """Analyse les premières frames d'une vidéo"""
    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"❌ Impossible d'ouvrir: {video_path}")
            return
        
        print(f"\n🎬 Analyse de: {video_path}")
        
        # Info vidéo
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        print(f"📹 {width}x{height}, {fps:.1f}fps, {total_frames} frames")
        
        model = YOLO('yolov8n.pt')
        
        # Tester quelques frames
        for frame_num in [1, 10, 30, 60]:
            if frame_num >= total_frames:
                continue
                
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
            ret, frame = cap.read()
            if not ret:
                continue
                
            print(f"\n🔍 Frame {frame_num}:")
            test_detection_on_frame(model, frame)
        
        cap.release()
        
    except Exception as e:
        print(f"❌ Erreur: {e}")

def main():
    print("🎯 DEBUG DETECTION TOOL")
    print("=" * 50)
    
    # 1. Afficher les classes YOLO
    model = debug_yolo_classes()
    
    if model is None:
        return
    
    # 2. Tester sur votre vidéo spécifique si elle existe
    import os
    possible_paths = [
        "/tmp/tmpn3t9jn28.mp4",  # Dernier fichier temp des logs
        "../copied_services/python-services/detection-service/output.mp4"
    ]
    
    for video_path in possible_paths:
        if os.path.exists(video_path):
            debug_video_first_frames(video_path)
            break
    else:
        print("\n💡 Aucune vidéo de test trouvée")
        print("   Uploadez une vidéo et vérifiez les logs pour le chemin temp")

if __name__ == "__main__":
    main()