"""
Configuration for Smart Lost Object Detection
Customizable settings for optimal detection without excessive zoom
"""

# Detection Settings
DETECTION_CONFIG = {
    # Core Detection Parameters
    'confidence_threshold': 0.85,      # Minimum confidence for detection
    'nms_threshold': 0.5,              # Non-maximum suppression threshold
    'max_detections_per_frame': 10,    # Maximum objects to detect per frame
    
    # Smart Cropping Settings (NO EXCESSIVE ZOOM)
    'zoom_padding': 0.4,               # 40% padding around objects
    'min_crop_size': 150,              # Minimum crop size in pixels
    'max_crop_size': 800,              # Maximum crop size in pixels
    'adaptive_padding': True,          # Use adaptive padding based on object size
    
    # Lost Item Categories (ONLY RELEVANT ITEMS)
    'target_categories': {
        'bags': ['backpack', 'handbag', 'suitcase', 'duffel bag', 'purse', 'wallet'],
        'electronics': ['cell phone', 'smartphone', 'laptop', 'tablet', 'camera', 'headphones', 'earbuds'],
        'personal': ['keys', 'sunglasses', 'watch', 'jewelry', 'ring', 'necklace'],
        'everyday': ['umbrella', 'book', 'bottle', 'cup', 'thermos', 'lunchbox'],
        'documents': ['passport', 'id card', 'driver license', 'documents', 'papers']
    },
    
    # Context Rules for Lost Items
    'context_rules': {
        'position_filters': {
            'ground_level_threshold': 0.6,    # Objects below 60% of frame height
            'isolation_radius': 0.15,         # No person within 15% of frame
            'stationary_frames': 5             # Object must be still for 5 frames
        },
        
        'size_filters': {
            'min_area_ratio': 0.0008,         # 0.08% of frame minimum
            'max_area_ratio': 0.25,           # 25% of frame maximum
            'aspect_ratio_range': (0.2, 5.0), # Width/height between 0.2 and 5.0
        },
        
        'visual_filters': {
            'min_brightness': 25,             # Avoid too dark regions
            'min_sharpness': 40,              # Avoid blurry regions
            'color_variance': 15               # Minimum color variance
        }
    },
    
    # Abandonment Scoring
    'abandonment_weights': {
        'context_weight': 0.4,        # How much context matters
        'position_weight': 0.3,       # How much position matters  
        'duration_weight': 0.2,       # How long object has been there
        'category_weight': 0.1        # Category-based likelihood
    },
    
    # Processing Settings
    'frame_skip': 30,                 # Process every 30th frame for efficiency
    'output_quality': 95,             # JPEG quality for saved images
    'log_level': 'INFO'               # Logging level
}

# Lost Item Context Definitions
LOST_CONTEXTS = {
    'abandoned_on_ground': {
        'score': 0.9,
        'description': 'Object sitting on ground, no owner nearby'
    },
    'dropped_on_surface': {
        'score': 0.7,
        'description': 'Object on table/bench, appears forgotten'
    },
    'forgotten_on_seat': {
        'score': 0.8,
        'description': 'Object left on chair/seat'
    },
    'left_unattended': {
        'score': 0.9,
        'description': 'Object with no person nearby for extended time'
    },
    'stationary_object': {
        'score': 0.6,
        'description': 'Object that hasnt moved for a while'
    }
}

# Category-specific Rules
CATEGORY_RULES = {
    'backpack': {
        'typical_contexts': ['abandoned_on_ground', 'forgotten_on_seat'],
        'min_size_ratio': 0.01,
        'abandonment_likelihood': 0.7
    },
    'cell phone': {
        'typical_contexts': ['dropped_on_surface', 'forgotten_on_seat'],
        'min_size_ratio': 0.0008,
        'abandonment_likelihood': 0.9
    },
    'keys': {
        'typical_contexts': ['dropped_on_surface', 'forgotten_on_seat'],
        'min_size_ratio': 0.0005,
        'abandonment_likelihood': 0.95
    },
    'wallet': {
        'typical_contexts': ['dropped_on_surface', 'abandoned_on_ground'],
        'min_size_ratio': 0.001,
        'abandonment_likelihood': 0.95
    },
    'sunglasses': {
        'typical_contexts': ['forgotten_on_seat', 'dropped_on_surface'],
        'min_size_ratio': 0.001,
        'abandonment_likelihood': 0.8
    }
}

# Advanced Filtering Rules
SMART_FILTERS = {
    # Exclude common false positives
    'exclude_patterns': [
        'person_holding_object',      # Don't detect objects being held
        'object_in_use',             # Don't detect objects actively used
        'decorative_items',          # Don't detect permanent decorations
        'furniture_parts',           # Don't detect parts of furniture
        'shadows_reflections'        # Don't detect shadows or reflections
    ],
    
    # Include only suspicious scenarios
    'include_patterns': [
        'isolated_object',           # Object with no person nearby
        'ground_level_object',       # Object on floor/ground
        'forgotten_item',            # Object left behind
        'dropped_item',              # Object that appears dropped
        'abandoned_belongings'       # Clearly abandoned items
    ],
    
    # Time-based rules
    'temporal_rules': {
        'min_observation_time': 10,  # Seconds before considering "lost"
        'max_tracking_time': 300,    # 5 minutes max tracking
        'confidence_decay': 0.95     # Confidence decay per frame
    }
}

def get_config():
    """Get the complete configuration"""
    return {
        'detection': DETECTION_CONFIG,
        'contexts': LOST_CONTEXTS,
        'categories': CATEGORY_RULES,
        'filters': SMART_FILTERS
    }

def get_detection_config():
    """Get just the detection configuration"""
    return DETECTION_CONFIG

def update_config(new_settings: dict):
    """Update configuration with new settings"""
    DETECTION_CONFIG.update(new_settings)
    return DETECTION_CONFIG