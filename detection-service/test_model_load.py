import torch
import sys

def test_model_load(model_path):
    print(f"PyTorch version: {torch.__version__}")
    print(f"CUDA available: {torch.cuda.is_available()}")
    print(f"Device: {torch.device('cuda' if torch.cuda.is_available() else 'cpu')}")
    
    try:
        print(f"\nLoading model from: {model_path}")
        model = torch.load(model_path, map_location='cpu')
        print("Model loaded successfully!")
        
        if isinstance(model, dict):
            print("\nModel keys:", list(model.keys()))
            if 'model' in model:
                print("Found 'model' key in state dict")
                model = model['model']
        
        print("\nModel type:", type(model))
        if hasattr(model, 'state_dict'):
            print("Model has state_dict")
            print("State dict keys:", list(model.state_dict().keys()))
        
    except Exception as e:
        print(f"\nError loading model: {e}")
        raise

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python test_model_load.py <model_path>")
        sys.exit(1)
        
    test_model_load(sys.argv[1]) 