from ultralytics import YOLO
import sys

try:
    print('Loading model...')
    model = YOLO('../stable_model_epoch_30.pth')
    print('Exporting to TorchScript (default name)...')
    result = model.export(format='torchscript')
    print('Export result:', result)
    print('✅ TorchScript export attempted. Check for .torchscript or .pt files.')
except Exception as e:
    print('❌ Error during export:', e, file=sys.stderr)
    raise 