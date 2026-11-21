"""
Optional utility script: Generates a valid PyTorch ResNet18 checkpoint with 3 output classes
matching the exact architecture requirements (Healthy, Powdery, Rust).
This allows testing end-to-end model inference immediately before copying your final
trained disease_resnet18.pth weights.
"""
import sys
from pathlib import Path
import torch
import torch.nn as nn
from torchvision import models

def create_sample_checkpoint(destination_path: Path):
    print(f"Generating ResNet18 checkpoint with 3 classes for: {destination_path}")
    model = models.resnet18(weights=None)
    model.fc = nn.Linear(model.fc.in_features, 3)
    
    destination_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), destination_path)
    print(f"Checkpoint successfully written to {destination_path} ({destination_path.stat().st_size} bytes)")

if __name__ == "__main__":
    target = Path(__file__).resolve().parent.parent / "models" / "disease_resnet18.pth"
    if target.exists():
        print(f"A model file already exists at {target}. Not overwriting.")
    else:
        create_sample_checkpoint(target)
