#!/usr/bin/env python3
"""
Script pour exécuter la détection d'objets sur une image individuelle
"""

import argparse
import os
import sys
import json
import cv2
import torch
import logging
from pathlib import Path
from datetime import datetime
from object_detector import ObjectDetector

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def find_latest_model():
    """Trouver le dernier modèle entraîné dans le répertoire"""
    model_files = list(Path('.').glob('stable_model_epoch_*.pth')) + list(Path('.').glob('*.pt'))
    if not model_files:
        logger.error("Aucun fichier modèle trouvé! Placez votre fichier modèle dans le répertoire.")
        return None
    return max(model_files, key=lambda p: p.stat().st_mtime)

def run_detection(image_path, model_path=None, confidence_threshold=0.5, output_path=None):
    """Exécuter la détection sur l'image spécifiée"""
    
    # Vérifier si l'image existe
    if not os.path.exists(image_path):
        logger.error(f"Image non trouvée: {image_path}")
        return []
    
    # Trouver le modèle si non spécifié
    if not model_path:
        model_path = find_latest_model()
        if not model_path:
            return []
    
    logger.info(f"Utilisation du modèle: {model_path}")
    logger.info(f"Traitement de l'image: {image_path}")
    
    try:
        # Charger l'image
        image = cv2.imread(str(image_path))
        if image is None:
            logger.error(f"Impossible de lire l'image: {image_path}")
            return []
        
        # Initialiser le détecteur d'objets
        detector = ObjectDetector(str(model_path))
        
        # Exécuter la détection sur l'image
        detections = detector.process_frame(image)
        
        # Dessiner les boîtes englobantes sur l'image si un chemin de sortie est spécifié
        if output_path:
            output_image = detector._draw_detections(image.copy(), detections)
            cv2.imwrite(output_path, output_image)
            logger.info(f"Image avec détections enregistrée: {output_path}")
        
        # Afficher et retourner les détections
        logger.info(f"Détections trouvées: {len(detections)}")
        for i, det in enumerate(detections):
            logger.info(f"  {i+1}. {det['class_name']} ({det['score']:.2f})")
        
        # Imprimer les détections au format JSON pour faciliter l'analyse par le frontend
        print(f"DETECTIONS: {json.dumps(detections)}")
        
        return detections
        
    except Exception as e:
        logger.error(f"Erreur lors de la détection: {e}")
        import traceback
        traceback.print_exc()
        return []

def main():
    parser = argparse.ArgumentParser(description='Détecter des objets dans une image')
    parser.add_argument('--image', required=True, help='Chemin vers l\'image à analyser')
    parser.add_argument('--model', help='Chemin vers le fichier du modèle (optionnel)')
    parser.add_argument('--threshold', type=float, default=0.5, help='Seuil de confiance pour la détection')
    parser.add_argument('--output', help='Chemin pour enregistrer l\'image avec les détections (optionnel)')
    
    args = parser.parse_args()
    
    run_detection(args.image, args.model, args.threshold, args.output)

if __name__ == "__main__":
    main() 