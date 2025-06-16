import cv2
import torch
from ultralytics import YOLO
import time
import os
from tqdm import tqdm

def test_model(model_path, video_path, output_path, test_duration=10):
    # Charger le modèle
    print(f"🔄 Chargement du modèle {model_path}...")
    model = YOLO(model_path)
    
    # Ouvrir la vidéo
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"❌ Erreur: Impossible d'ouvrir la vidéo {video_path}")
        return
    
    # Obtenir les propriétés de la vidéo
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Calculer le nombre de frames à tester
    frames_to_test = min(total_frames, int(test_duration * fps))
    
    # Créer le writer pour la vidéo de sortie
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    frame_count = 0
    total_time = 0
    total_detections = 0
    
    print(f"🚀 Début du test avec le modèle {model_path}")
    print(f"📊 Test sur {test_duration} secondes ({frames_to_test} frames)")
    
    # Créer la barre de progression
    pbar = tqdm(total=frames_to_test, desc="Traitement des frames")
    
    while cap.isOpened() and frame_count < frames_to_test:
        ret, frame = cap.read()
        if not ret:
            break
            
        # Mesurer le temps de détection
        start_time = time.time()
        
        # Faire la détection
        results = model(frame, conf=0.25)
        
        # Calculer le temps de traitement
        process_time = time.time() - start_time
        total_time += process_time
        
        # Dessiner les résultats
        annotated_frame = results[0].plot()
        
        # Compter les détections
        detections = len(results[0].boxes)
        total_detections += detections
        
        # Afficher les informations
        cv2.putText(annotated_frame, f"FPS: {1/process_time:.1f}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(annotated_frame, f"Detections: {detections}", (10, 70),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        # Écrire le frame
        out.write(annotated_frame)
        frame_count += 1
        
        # Mettre à jour la barre de progression
        pbar.update(1)
        pbar.set_postfix({
            'FPS': f"{1/process_time:.1f}",
            'Detections': detections
        })
    
    # Nettoyer
    pbar.close()
    cap.release()
    out.release()
    
    # Calculer les statistiques
    avg_time = total_time / frame_count
    avg_detections = total_detections / frame_count
    
    print("\n📊 Résultats du test:")
    print(f"Modèle: {model_path}")
    print(f"Frames traitées: {frame_count}")
    print(f"Temps moyen par frame: {avg_time*1000:.1f}ms")
    print(f"Détections moyennes par frame: {avg_detections:.1f}")
    print(f"Vidéo de sortie sauvegardée: {output_path}")

if __name__ == "__main__":
    # Tester uniquement le modèle YOLOv8 officiel
    test_model(
        "yolov8n.pt",
        "../20250615_034055.mp4",
        "output_yolov8.mp4",
        test_duration=10  # Tester seulement 10 secondes
    )
