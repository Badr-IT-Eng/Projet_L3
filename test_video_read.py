import cv2
import sys

print('OpenCV version:', cv2.__version__)

video_path = 'test_videos/stock-footage-shanghai-china-february-passengers-boarding-high-speed-train-at-shanghai-station-on-a.webm'

# Try default backend
cap = cv2.VideoCapture(video_path)
if not cap.isOpened():
    print('❌ Could not open video with default backend.')
    # Try FFMPEG backend if available
    cap = cv2.VideoCapture(video_path, cv2.CAP_FFMPEG)
    if not cap.isOpened():
        print('❌ Could not open video with FFMPEG backend either.')
        sys.exit(1)
    else:
        print('✅ Opened video with FFMPEG backend.')
else:
    print('✅ Opened video with default backend.')

frame_idx = 0
while True:
    ret, frame = cap.read()
    if not ret:
        print('End of video or cannot read frame.')
        break
    print(f'Frame {frame_idx}: shape={frame.shape}, dtype={frame.dtype}')
    frame_idx += 1
    if frame_idx >= 5:
        print('Stopping after 5 frames for test.')
        break
cap.release()
print('✅ Video reading test complete.') 