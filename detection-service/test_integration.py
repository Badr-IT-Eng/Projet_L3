#!/usr/bin/env python3
"""
Test script to verify integration between object detection and Spring Boot backend
"""

import os
import sys
from pathlib import Path
import logging
from datetime import datetime
from object_detector import ObjectDetector
import glob
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_jwt_token():
    url = "http://localhost:8082/api/auth/signin"
    data = {"username": "admin", "password": "admin"}
    try:
        r = requests.post(url, json=data)
        r.raise_for_status()
        return r.json()["token"]
    except Exception as e:
        print(f"Erreur d'authentification: {e}")
        return None

def main():
    # Chemin de la vidéo à tester
    video_path = "/home/badr/lost-found-system-new/lost-found-system/20250615_034055.mp4"
    if not os.path.exists(video_path):
        logger.error(f"Test video not found: {video_path}")
        return

    # Cherche tous les modèles .pth et .pt dans le dossier courant
    model_paths = sorted(glob.glob("*.pth") + glob.glob("*.pt"))
    if not model_paths:
        logger.error("Aucun modèle .pth ou .pt trouvé dans le dossier.")
        return

    logger.info("=== RECOVR System Integration Test (All Models) ===")
    logger.info(f"Using video: {video_path}")
    logger.info("Ce test va :")
    logger.info("1. Tester chaque modèle sur la vidéo")
    logger.info("2. Envoyer les objets détectés au backend Spring Boot")
    logger.info("3. Afficher les résultats pour chaque modèle")

    # Get JWT token for authenticated requests
    token = get_jwt_token()
    headers = {"Authorization": f"Bearer {token}"} if token else {}

    for model_path in model_paths:
        logger.info(f"\n--- Test du modèle : {model_path} ---")
        try:
            detector = ObjectDetector(model_path)
            os.makedirs('snapshots', exist_ok=True)
            detections = detector.process_video(video_path, output_path=f"output_{model_path}.mp4", save_to_db=True, headers=headers)
            logger.info(f"✅ Modèle {model_path} : {len(detections)} objets détectés et envoyés au backend.")
        except Exception as e:
            logger.error(f"❌ Erreur avec le modèle {model_path} : {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    main() 