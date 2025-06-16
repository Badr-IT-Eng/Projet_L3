#!/usr/bin/env python3
"""
RECOVR Detection Service Starter
Starts the object detection service with proper configuration
"""

import os
import sys
import logging
from pathlib import Path
import argparse
from datetime import datetime
import cv2
from object_detector import ObjectDetector
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(f'detection_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')
    ]
)

logger = logging.getLogger(__name__)

def main():
    # Configuration du logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )

    # Configuration des arguments
    parser = argparse.ArgumentParser(description='Object Detection Service')
    parser.add_argument('--video', type=str, help='Path to video file')
    parser.add_argument('--camera', type=int, default=None, help='Camera index (default: None)')
    parser.add_argument('--location', type=str, required=True, help='Location where the detection is happening')
    parser.add_argument('--model', type=str, default='stable_model_epoch_30.pt', help='Path to model file')
    parser.add_argument('--output', type=str, help='Path to save output video')
    parser.add_argument('--skip-frames', type=int, default=2, help='Number of frames to skip between detections')
    args = parser.parse_args()

    try:
        # Initialiser le détecteur
        detector = ObjectDetector(
            model_path=args.model,
            num_classes=29,
            device=None  # Utilisera automatiquement CUDA si disponible
        )

        # Déterminer la source vidéo
        video_source = args.camera if args.camera is not None else args.video
        if video_source is None:
            raise ValueError("Either --video or --camera must be specified")

        logging.info(f"Starting detection from {'camera ' + str(args.camera) if args.camera is not None else 'video file: ' + args.video}")
        logging.info(f"Location: {args.location}")
        logging.info(f"Using model: {args.model}")
        logging.info(f"Skipping {args.skip_frames} frames between detections")

        # Démarrer la détection
        detector.process_video(
            video_path=video_source,
            output_path=args.output,
            save_to_db=True,
            location=args.location,
            skip_frames=args.skip_frames
        )

    except Exception as e:
        logging.error(f"Error in detection service: {str(e)}")
        raise
    finally:
        logging.info("Detection service stopped")

if __name__ == "__main__":
    main() 