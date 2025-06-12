from ultralytics import YOLO
import sys

try:
    print("Trying to load model...", flush=True)
    model = YOLO('../stable_model_epoch_30.pth')
    print("✅ Model loaded successfully!", flush=True)
except Exception as e:
    print("❌ Failed to load model:", e, flush=True)
finally:
    print("[END OF SCRIPT]", flush=True) 