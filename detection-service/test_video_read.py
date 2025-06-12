import cv2
import os
import sys
from datetime import datetime

# Create a log file with timestamp
log_file = f"video_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

def log_message(message):
    with open(log_file, 'a') as f:
        f.write(f"{datetime.now()}: {message}\n")

log_message("Script started")
log_message(f"Python version: {sys.version}")
log_message(f"OpenCV version: {cv2.__version__}")

if len(sys.argv) < 2:
    log_message("Error: No video path provided")
    sys.exit(1)

video_path = sys.argv[1]
log_message(f"Attempting to open video: {video_path}")
log_message(f"File exists: {os.path.exists(video_path)}")

cap = cv2.VideoCapture(video_path)
if not cap.isOpened():
    log_message("Failed to open video")
    sys.exit(1)

log_message("Successfully opened video")

frame_count = 0
while True:
    ret, frame = cap.read()
    if not ret:
        log_message(f"End of video or read error after {frame_count} frames")
        break
        
    frame_count += 1
    if frame_count % 30 == 0:
        log_message(f"Read {frame_count} frames")
    
    # Try to display the frame
    cv2.imshow('Video Test', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        log_message("User pressed 'q' to quit")
        break

cap.release()
cv2.destroyAllWindows()
log_message(f"Finished. Total frames read: {frame_count}")
