# 🎯 Smart Lost Object Detection System

## 🚀 Features

### ✅ **Intelligent Detection**
- **ONLY detects ACTUALLY lost items** (no false positives)
- **Contextual awareness** - knows what constitutes a "lost" object
- **Smart filtering** - excludes objects being held, decorative items, etc.

### 📸 **Optimal Image Cropping**
- **NO excessive zoom** - 40% padding around objects for context
- **Adaptive cropping** - smaller objects get more surrounding context  
- **High quality output** - 95% JPEG quality for clear images
- **Intelligent sizing** - minimum 150px crops, maximum 800px

### 🎛️ **Highly Configurable**
- **Adjustable confidence thresholds** (default: 85%)
- **Customizable padding levels** (default: 40%)
- **Category-specific rules** for different object types
- **Context-aware scoring** for abandonment likelihood

---

## 🛠️ Installation

### 1. Install Dependencies
```bash
cd python-detection
pip install -r requirements.txt
```

### 2. Verify Installation
```bash
python -c "import cv2, torch; print('✅ All dependencies installed')"
```

---

## 🎬 Usage

### Basic Usage
```bash
python run_detection.py your_video.mp4
```

### Advanced Usage with Custom Settings
```python
from smart_lost_object_detector import SmartLostObjectDetector

# Initialize with custom settings
detector = SmartLostObjectDetector(
    confidence_threshold=0.90,  # Higher accuracy
    zoom_padding=0.5           # More context around objects
)

# Process video
results = detector.process_video_stream("video.mp4")
```

---

## ⚙️ Configuration

### Detection Settings (`config.py`)

```python
DETECTION_CONFIG = {
    # Core Parameters
    'confidence_threshold': 0.85,    # 85% confidence minimum
    'zoom_padding': 0.4,             # 40% padding (NO excessive zoom)
    'min_crop_size': 150,            # Minimum crop size
    
    # Smart Filtering
    'target_categories': {
        'bags': ['backpack', 'handbag', 'suitcase'],
        'electronics': ['phone', 'laptop', 'tablet'],
        'personal': ['keys', 'wallet', 'sunglasses']
    }
}
```

### Zoom Control Settings

| Setting | Value | Effect |
|---------|-------|--------|
| `zoom_padding: 0.2` | 20% padding | Tight crop |
| `zoom_padding: 0.4` | **40% padding** | **Optimal (recommended)** |
| `zoom_padding: 0.6` | 60% padding | Loose crop with lots of context |

---

## 🎯 Smart Detection Logic

### What Gets Detected ✅
- **Abandoned bags** on ground with no owner nearby
- **Dropped phones** on tables/surfaces, stationary
- **Forgotten keys** on benches, isolated
- **Left wallets** on ground, unattended
- **Lost sunglasses** on seats, no person nearby

### What Gets Filtered Out ❌
- Objects being **actively held** by people
- **Decorative items** (permanent fixtures)
- Objects **in active use** (person interacting)
- **Parts of furniture** or architecture
- **Shadows and reflections**

---

## 📊 Output Format

### Detection Results
```json
{
  "total_detections": 3,
  "categories_found": ["backpack", "cell phone", "keys"],
  "high_confidence_items": [...],
  "likely_abandoned": [...],
  "detections": [
    {
      "category": "backpack",
      "confidence": 0.91,
      "context": "abandoned_on_ground",
      "abandonment_score": 0.85,
      "cropped_image_path": "detection_1_backpack.jpg",
      "bbox": [120, 340, 80, 60],
      "zoom_level": "optimal"
    }
  ]
}
```

### Output Files
- **`detection_report.json`** - Complete analysis results
- **`detections/`** - Folder with cropped object images
- **Console logs** - Real-time processing feedback

---

## 🔧 Advanced Customization

### 1. Adjust Zoom Level
```python
# Minimal zoom (lots of context)
detector = SmartLostObjectDetector(zoom_padding=0.6)

# Moderate zoom (balanced)
detector = SmartLostObjectDetector(zoom_padding=0.4)  # Default

# Tighter zoom (less context)
detector = SmartLostObjectDetector(zoom_padding=0.2)
```

### 2. Category-Specific Rules
```python
# Focus only on high-value items
CATEGORY_RULES = {
    'cell phone': {'abandonment_likelihood': 0.95},
    'wallet': {'abandonment_likelihood': 0.95},
    'keys': {'abandonment_likelihood': 0.90}
}
```

### 3. Context Sensitivity
```python
# Very strict (only obvious lost items)
detector = SmartLostObjectDetector(confidence_threshold=0.95)

# Balanced (recommended)
detector = SmartLostObjectDetector(confidence_threshold=0.85)

# More permissive (catches more but may have false positives)  
detector = SmartLostObjectDetector(confidence_threshold=0.75)
```

---

## 🎮 Examples

### Example 1: Airport Terminal
```bash
python run_detection.py airport_security_footage.mp4
```
**Expected output**: Forgotten luggage, dropped phones, lost passports

### Example 2: University Campus
```bash
python run_detection.py campus_video.mp4
```
**Expected output**: Abandoned backpacks, forgotten laptops, lost keys

### Example 3: Shopping Mall
```bash
python run_detection.py mall_surveillance.mp4
```
**Expected output**: Shopping bags left behind, dropped wallets, forgotten umbrellas

---

## 📈 Performance Tips

### 1. **Video Quality**
- **1080p recommended** for best detection accuracy
- **30 FPS or higher** for smooth tracking
- **Good lighting** improves detection confidence

### 2. **Processing Speed**
- **Frame skipping**: Process every 30th frame (configurable)
- **GPU acceleration**: Use CUDA-capable GPU if available
- **Batch processing**: Process multiple videos sequentially

### 3. **Accuracy Tuning**
- **Higher confidence** = fewer false positives, might miss some items
- **Lower confidence** = catches more items, might include false positives
- **Context rules** = most important for accuracy

---

## 🐛 Troubleshooting

### Common Issues

**❌ "No objects detected"**
- Lower `confidence_threshold` to 0.75
- Check if video has clear object visibility
- Verify objects match target categories

**❌ "Too many false positives"**
- Raise `confidence_threshold` to 0.90+
- Enable stricter context rules
- Check category filtering

**❌ "Images too zoomed in"**
- Increase `zoom_padding` to 0.5 or 0.6
- Adjust `min_crop_size` to larger value
- Enable `adaptive_padding`

**❌ "Images too wide"**
- Decrease `zoom_padding` to 0.3
- Set `max_crop_size` to smaller value
- Adjust aspect ratio limits

---

## 🚀 Integration with Lost & Found System

This Python detector can be integrated with the web frontend:

1. **Upload video** via web interface
2. **Process with Python** script automatically  
3. **Extract object images** with optimal cropping
4. **Save to database** with metadata
5. **Display results** in web dashboard

---

## 📝 License

MIT License - Feel free to modify and improve!

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add improvements
4. Submit pull request

**Focus areas for contribution:**
- ✨ Better object detection models (YOLO, RCNN)
- 🎯 Improved context analysis algorithms  
- 📱 Mobile app integration
- 🔄 Real-time streaming support