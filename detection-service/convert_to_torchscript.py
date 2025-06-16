import torch
import torchvision
from torchvision.models.detection import fasterrcnn_resnet50_fpn
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor

def convert_to_torchscript(model_path, output_path):
    # Load the model
    model = fasterrcnn_resnet50_fpn(pretrained=False)
    
    # Modify the classifier for our number of classes
    num_classes = 29  # Including background
    in_features = model.roi_heads.box_predictor.cls_score.in_features
    model.roi_heads.box_predictor = FastRCNNPredictor(in_features, num_classes)
    
    # Load the state dict
    state_dict = torch.load(model_path, map_location=torch.device('cpu'))
    model.load_state_dict(state_dict)
    
    # Set to eval mode
    model.eval()
    
    # Create example input
    example = torch.rand(1, 3, 800, 800)
    
    # Convert to TorchScript
    traced_script_module = torch.jit.trace(model, example)
    
    # Save the TorchScript model
    traced_script_module.save(output_path)
    print(f"Model converted and saved to {output_path}")

if __name__ == "__main__":
    input_model = "stable_model_epoch_30.pth"
    output_model = "stable_model_epoch_30.pt"
    convert_to_torchscript(input_model, output_model) 