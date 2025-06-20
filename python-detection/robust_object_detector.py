#!/usr/bin/env python3
"""
🎯 ROBUST LOST OBJECT DETECTOR
Détecteur robuste pour tous types d'objets perdus avec filtrage intelligent
"""

import cv2
import numpy as np
import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from ultralytics import YOLO

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class RobustLostObjectDetector:
    """
    Détecteur robuste pour objets perdus avec:
    - Détection multi-catégories
    - Filtrage intelligent
    - Gestion d'erreurs robuste
    - Classification intelligente
    """
    
    def __init__(self, confidence_threshold: float = 0.3):
        self.confidence_threshold = confidence_threshold
        self.model = None
        self._initialize_model()
        self._setup_categories()
        
        logger.info("🎯 Robust Lost Object Detector initialized successfully")
    
    def _initialize_model(self):
        """Initialise le modèle YOLO avec gestion d'erreurs"""
        try:
            model_path = 'yolov8n.pt'
            if not os.path.exists(model_path):
                logger.warning(f"Model file {model_path} not found, YOLO will download it")
            
            self.model = YOLO(model_path)
            logger.info("✅ YOLO model loaded successfully")
            
            # Test the model
            test_frame = np.zeros((100, 100, 3), dtype=np.uint8)
            results = self.model(test_frame, verbose=False)
            logger.info("✅ Model test successful")
            
        except Exception as e:
            logger.error(f"❌ Could not initialize YOLO model: {e}")
            self.model = None
            raise RuntimeError(f"Failed to initialize detection model: {e}")
    
    def _setup_categories(self):
        """Configure les catégories d'objets perdus avec classification intelligente"""
        
        # Catégories principales avec leurs variantes YOLO
        self.category_mapping = {
            # Sacs et bagages
            'BAGS': {
                'keywords': ['suitcase', 'luggage', 'backpack', 'handbag', 'bag', 'purse', 'briefcase', 'duffel bag'],
                'priority': 0.9,  # Priorité élevée pour les sacs
                'min_size_ratio': 0.0001  # Taille minimum très petite
            },
            
            # Électronique
            'ELECTRONICS': {
                'keywords': ['cell phone', 'mobile phone', 'laptop', 'tablet', 'camera', 'keyboard', 
                           'mouse', 'headphones', 'charger', 'power bank'],
                'priority': 0.95,  # Priorité très élevée
                'min_size_ratio': 0.0005
            },
            
            # Objets personnels
            'PERSONAL': {
                'keywords': ['wallet', 'keys', 'sunglasses', 'glasses', 'watch', 'jewelry', 
                           'ring', 'necklace', 'bracelet'],
                'priority': 0.9,
                'min_size_ratio': 0.0002
            },
            
            # Vêtements et accessoires
            'CLOTHING': {
                'keywords': ['hat', 'cap', 'jacket', 'coat', 'scarf', 'gloves', 'shoes', 
                           'sneakers', 'boots', 'shirt', 'pants'],
                'priority': 0.7,
                'min_size_ratio': 0.002
            },
            
            # Objets divers
            'MISCELLANEOUS': {
                'keywords': ['book', 'bottle', 'cup', 'umbrella', 'sports ball', 'teddy bear', 
                           'toy', 'document', 'paper', 'folder', 'pen', 'pencil'],
                'priority': 0.6,
                'min_size_ratio': 0.0008
            },
            
            # Cas spéciaux YOLO
            'SPECIAL': {
                'keywords': ['train'],  # YOLO confond parfois les valises avec des trains
                'priority': 0.8,
                'min_size_ratio': 0.001
            }
        }
        
        # Créer un index de recherche rapide
        self.keyword_to_category = {}
        for category, config in self.category_mapping.items():
            for keyword in config['keywords']:
                self.keyword_to_category[keyword.lower()] = category
    
    def _classify_object(self, class_name: str) -> Tuple[str, float]:
        """
        Classifie un objet détecté par YOLO
        Retourne: (category, priority)
        """
        class_name_lower = class_name.lower()
        
        # Recherche exacte d'abord
        if class_name_lower in self.keyword_to_category:
            category = self.keyword_to_category[class_name_lower]
            priority = self.category_mapping[category]['priority']
            return category, priority
        
        # Recherche partielle si pas de correspondance exacte
        for keyword, category in self.keyword_to_category.items():
            if keyword in class_name_lower or class_name_lower in keyword:
                priority = self.category_mapping[category]['priority']
                return category, priority
        
        # Catégorie par défaut
        return 'MISCELLANEOUS', 0.5
    
    def detect_lost_objects(self, video_path: str) -> Dict:
        """
        Détecte les objets perdus dans une vidéo
        """
        logger.info(f"🎬 Processing video: {video_path}")
        
        # Validation du fichier
        if not self._validate_video_file(video_path):
            raise ValueError(f"Invalid video file: {video_path}")
        
        if not self.model:
            raise RuntimeError("Detection model not initialized")
        
        # Traitement de la vidéo
        detected_objects = self._process_video_frames(video_path)
        
        # Sélection du meilleur objet
        best_object = self._select_best_object(detected_objects)
        
        # Génération du rapport
        report = self._generate_report(best_object, video_path, detected_objects)
        
        if best_object:
            self._save_object_image(best_object)
            logger.info(f"🎉 Object detected successfully!")
            logger.info(f"📦 Category: {best_object['category']}")
            logger.info(f"📊 Confidence: {best_object['confidence']:.1%}")
            logger.info(f"⏱️  Found at: {best_object['video_timestamp']}")
        else:
            logger.warning("⚠️ No objects detected")
        
        return report
    
    def _validate_video_file(self, video_path: str) -> bool:
        """Valide le fichier vidéo"""
        try:
            if not os.path.exists(video_path):
                logger.error(f"❌ Video file does not exist: {video_path}")
                return False
            
            file_size = os.path.getsize(video_path)
            if file_size == 0:
                logger.error(f"❌ Video file is empty: {video_path}")
                return False
            
            if file_size < 1000:  # Moins de 1KB est probablement invalide
                logger.warning(f"⚠️ Video file very small: {file_size} bytes")
            
            logger.info(f"📁 Video file size: {file_size:,} bytes")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error validating video file: {e}")
            return False
    
    def _process_video_frames(self, video_path: str) -> List[Dict]:
        """Traite les frames de la vidéo et détecte les objets"""
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        logger.info(f"📹 Video: {width}x{height}, {fps:.1f}fps, {total_frames} frames")
        
        detected_objects = []
        frame_count = 0
        
        # Traiter un échantillon de frames (pour optimiser les performances)
        process_interval = max(1, min(10, int(fps // 2)))  # Maximum 2 frames par seconde
        
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                frame_count += 1
                
                if frame_count % process_interval == 0:
                    progress = (frame_count / total_frames) * 100
                    logger.info(f"🔍 Analyzing frame {frame_count}/{total_frames} ({progress:.1f}%)")
                    
                    # Détection YOLO
                    frame_objects = self._detect_frame_objects(frame, frame_count, fps)
                    detected_objects.extend(frame_objects)
                    
                    # Arrêter si on a trouvé suffisamment d'objets avec haute confiance
                    high_conf_objects = [obj for obj in detected_objects if obj['confidence'] > 0.8]
                    if len(high_conf_objects) >= 3:
                        logger.info(f"🎯 Found {len(high_conf_objects)} high-confidence objects, stopping early")
                        break
            
        finally:
            cap.release()
        
        logger.info(f"📊 Total objects detected: {len(detected_objects)}")
        return detected_objects
    
    def _detect_frame_objects(self, frame: np.ndarray, frame_number: int, fps: float) -> List[Dict]:
        """Détecte les objets dans une frame"""
        try:
            results = self.model(frame, verbose=False)
            frame_objects = []
            
            for result in results:
                if result.boxes is not None:
                    for box in result.boxes:
                        # Extraction des données
                        confidence = float(box.conf[0])
                        class_id = int(box.cls[0])
                        class_name = self.model.names[class_id]
                        
                        if confidence < self.confidence_threshold:
                            logger.debug(f"⚠️ Object {class_name} filtered out - confidence {confidence:.2f} < {self.confidence_threshold}")
                            continue
                        
                        # Classification de l'objet
                        category, priority = self._classify_object(class_name)
                        
                        # Validation de la taille
                        bbox = box.xyxy[0].cpu().numpy()
                        x1, y1, x2, y2 = map(int, bbox)
                        width, height = x2 - x1, y2 - y1
                        
                        if not self._validate_object_size(width, height, frame.shape, category):
                            logger.debug(f"⚠️ Object {class_name} filtered out - size validation failed: {width}x{height}")
                            continue
                        
                        # Calcul du score composite
                        timestamp = frame_number / fps
                        score = self._calculate_object_score(
                            confidence, priority, width, height, 
                            frame.shape[1], frame.shape[0], timestamp
                        )
                        
                        # Création de l'objet
                        obj = {
                            'frame_number': frame_number,
                            'timestamp': timestamp,
                            'video_timestamp': f"{int(timestamp//60):02d}:{int(timestamp%60):02d}",
                            'category': category,
                            'class_name': class_name,
                            'confidence': confidence,
                            'priority': priority,
                            'bbox': [x1, y1, width, height],
                            'score': score,
                            'cropped_image': self._crop_object_with_context(frame, x1, y1, x2, y2),
                            'method': 'robust_object_detection'
                        }
                        
                        frame_objects.append(obj)
                        
            return frame_objects
            
        except Exception as e:
            logger.error(f"❌ Error detecting objects in frame {frame_number}: {e}")
            return []
    
    def _validate_object_size(self, obj_width: int, obj_height: int, 
                            frame_shape: Tuple, category: str) -> bool:
        """Valide la taille d'un objet détecté"""
        frame_height, frame_width = frame_shape[:2]
        area_ratio = (obj_width * obj_height) / (frame_width * frame_height)
        
        # Récupérer les critères de taille pour la catégorie
        min_size_ratio = self.category_mapping.get(category, {}).get('min_size_ratio', 0.001)
        
        # Critères de validation
        if area_ratio < min_size_ratio:
            logger.debug(f"⚠️ Object too small: area_ratio {area_ratio:.4f} < {min_size_ratio}")
            return False
        
        if area_ratio > 0.8:  # Trop grand, probablement pas un objet perdu
            logger.debug(f"⚠️ Object too large: area_ratio {area_ratio:.4f} > 0.8")
            return False
        
        if obj_width < 10 or obj_height < 10:  # Trop petit en pixels absolus
            logger.debug(f"⚠️ Object too small in pixels: {obj_width}x{obj_height}")
            return False
        
        return True
    
    def _calculate_object_score(self, confidence: float, priority: float, 
                              width: int, height: int, frame_width: int, 
                              frame_height: int, timestamp: float) -> float:
        """Calcul d'un score composite pour l'objet"""
        
        # Score de confiance (40%)
        conf_score = confidence * 0.4
        
        # Score de priorité de catégorie (30%)
        priority_score = priority * 0.3
        
        # Score de taille (20%) - favorise les objets de taille moyenne
        area_ratio = (width * height) / (frame_width * frame_height)
        optimal_size = 0.05  # 5% de l'image est considéré comme optimal
        size_score = min(1.0, area_ratio / optimal_size) * 0.2
        if area_ratio > optimal_size:
            size_score = (1.0 - min(1.0, (area_ratio - optimal_size) / optimal_size)) * 0.2
        
        # Score de position (10%) - favorise le centre de l'image
        center_x = (width / 2) / frame_width
        center_y = (height / 2) / frame_height
        center_distance = np.sqrt((center_x - 0.5)**2 + (center_y - 0.5)**2)
        position_score = (1.0 - min(1.0, center_distance * 2)) * 0.1
        
        total_score = conf_score + priority_score + size_score + position_score
        return min(1.0, total_score)
    
    def _crop_object_with_context(self, frame: np.ndarray, x1: int, y1: int, 
                                x2: int, y2: int, padding_factor: float = 0.3) -> np.ndarray:
        """Extrait l'objet avec du contexte autour"""
        frame_height, frame_width = frame.shape[:2]
        
        width = x2 - x1
        height = y2 - y1
        
        # Ajouter du padding
        pad_x = int(width * padding_factor)
        pad_y = int(height * padding_factor)
        
        # Calculer les nouvelles coordonnées avec padding
        crop_x1 = max(0, x1 - pad_x)
        crop_y1 = max(0, y1 - pad_y)
        crop_x2 = min(frame_width, x2 + pad_x)
        crop_y2 = min(frame_height, y2 + pad_y)
        
        # S'assurer d'une taille minimale
        min_size = 150
        crop_width = crop_x2 - crop_x1
        crop_height = crop_y2 - crop_y1
        
        if crop_width < min_size or crop_height < min_size:
            # Centrer et élargir
            center_x = (x1 + x2) // 2
            center_y = (y1 + y2) // 2
            half_size = min_size // 2
            
            crop_x1 = max(0, center_x - half_size)
            crop_y1 = max(0, center_y - half_size)
            crop_x2 = min(frame_width, center_x + half_size)
            crop_y2 = min(frame_height, center_y + half_size)
        
        cropped = frame[crop_y1:crop_y2, crop_x1:crop_x2]
        
        logger.info(f"🖼️ Cropped object: {crop_x2-crop_x1}x{crop_y2-crop_y1} with {int(padding_factor*100)}% padding")
        return cropped
    
    def _select_best_object(self, detected_objects: List[Dict]) -> Optional[Dict]:
        """Sélectionne le meilleur objet détecté"""
        if not detected_objects:
            return None
        
        # Trier par score décroissant
        sorted_objects = sorted(detected_objects, key=lambda x: x['score'], reverse=True)
        
        logger.info(f"🏆 Best object: {sorted_objects[0]['category']} "
                   f"({sorted_objects[0]['confidence']:.1%} confidence, "
                   f"score: {sorted_objects[0]['score']:.3f})")
        
        return sorted_objects[0]
    
    def _generate_report(self, best_object: Optional[Dict], video_path: str, 
                        all_objects: List[Dict]) -> Dict:
        """Génère le rapport de détection"""
        
        # Statistiques
        category_stats = {}
        for obj in all_objects:
            cat = obj['category']
            if cat not in category_stats:
                category_stats[cat] = {'count': 0, 'avg_confidence': 0.0}
            category_stats[cat]['count'] += 1
            category_stats[cat]['avg_confidence'] += obj['confidence']
        
        # Calculer les moyennes
        for cat, stats in category_stats.items():
            stats['avg_confidence'] /= stats['count']
        
        report = {
            'video_info': {
                'path': video_path,
                'processing_time': datetime.now().isoformat(),
                'method': 'robust_object_detection'
            },
            'detection_result': {
                'object_found': best_object is not None,
                'detection_method': 'YOLO + Intelligent Filtering',
                'total_detections': len(all_objects),
                'categories_detected': list(category_stats.keys())
            },
            'statistics': {
                'category_breakdown': category_stats,
                'total_frames_processed': max([obj['frame_number'] for obj in all_objects]) if all_objects else 0
            }
        }
        
        if best_object:
            report['detected_object'] = {
                'category': best_object['category'],
                'class_name': best_object['class_name'],
                'confidence': f"{best_object['confidence']:.1%}",
                'priority': f"{best_object['priority']:.1%}",
                'score': f"{best_object['score']:.3f}",
                'found_at_time': best_object['video_timestamp'],
                'frame_number': best_object['frame_number'],
                'bounding_box': best_object['bbox'],
                'image_saved': 'robust_object_detection.jpg'
            }
            
            # Maintenir la compatibilité avec l'ancien format
            report['suitcase'] = report['detected_object']
        
        return report
    
    def _save_object_image(self, obj: Dict):
        """Sauvegarde l'image de l'objet détecté"""
        try:
            os.makedirs("strict_detections", exist_ok=True)
            
            output_path = "strict_detections/robust_object_detection.jpg"
            cv2.imwrite(output_path, obj['cropped_image'], [cv2.IMWRITE_JPEG_QUALITY, 95])
            
            # Sauvegarder aussi avec l'ancien nom pour compatibilité
            cv2.imwrite("strict_detections/strict_object_detection.jpg", 
                       obj['cropped_image'], [cv2.IMWRITE_JPEG_QUALITY, 95])
            
            logger.info(f"💾 Object image saved: {output_path}")
            
        except Exception as e:
            logger.error(f"❌ Failed to save object image: {e}")


def main():
    """Test du détecteur robuste"""
    print("🎯 ROBUST LOST OBJECT DETECTOR")
    print("=" * 50)
    print("✅ Détecte tous types d'objets perdus")
    print("🚫 Filtrage intelligent et robuste")
    print("🖼️ Extraction optimisée avec contexte")
    print("📊 Classification intelligente")
    print("=" * 50)
    
    try:
        detector = RobustLostObjectDetector(confidence_threshold=0.4)
        
        # Test avec une vidéo d'exemple
        video_path = '../copied_services/python-services/detection-service/output.mp4'
        
        if os.path.exists(video_path):
            results = detector.detect_lost_objects(video_path)
            
            # Sauvegarder le rapport
            with open("robust_detection_report.json", "w") as f:
                json.dump(results, f, indent=2, default=str)
            
            print("\n🎉 ROBUST DETECTION COMPLETE!")
            
            if results['detection_result']['object_found']:
                obj = results['detected_object']
                print(f"✅ Found lost object:")
                print(f"   📦 Category: {obj['category']}")
                print(f"   🏷️  Class: {obj['class_name']}")
                print(f"   🎯 Confidence: {obj['confidence']}")
                print(f"   ⭐ Priority: {obj['priority']}")
                print(f"   📊 Score: {obj['score']}")
                print(f"   ⏱️  Time: {obj['found_at_time']}")
                print(f"   🖼️  Image: {obj['image_saved']}")
            else:
                print("❌ No objects detected")
                print("💡 Try adjusting confidence threshold or check video content")
        else:
            print(f"❌ Test video not found: {video_path}")
            print("💡 Please provide a valid video file path")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())