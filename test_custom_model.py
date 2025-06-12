import torch
import torch.nn as nn
import cv2

# --- Placeholder model class ---
class CustomModel(nn.Module):
    def __init__(self):
        super().__init__()
        # Replace with your real model layers
        self.dummy = nn.Identity()
    def forward(self, x):
        return self.dummy(x)

# Load model
model = CustomModel()
try:
    model.load_state_dict(torch.load('../stable_model_epoch_30.pth', map_location='cpu'))
    print('✅ Model weights loaded!')
except Exception as e:
    print('❌ Error loading weights:', e)
model.eval()

# Open video
cap = cv2.VideoCapture('test_videos/stock-footage-shanghai-china-february-passengers-boarding-high-speed-train-at-shanghai-station-on-a.webm')
ret, frame = cap.read()
cap.release()
if not ret:
    print('❌ Could not read frame from video')
    exit(1)

# Preprocess frame (resize, normalize, etc. - adjust as needed)
img = cv2.resize(frame, (640, 640))
img = torch.from_numpy(img).permute(2, 0, 1).float() / 255.0
img = img.unsqueeze(0)

# Run inference
with torch.no_grad():
    output = model(img)
    print('Model output:', output) 