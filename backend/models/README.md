# AI Model Checkpoint Storage

Place your trained model files in this directory:

### 1. Plant Disease Classification Model (ResNet18)
- **Filename:** `disease_resnet18.pth`
- **Architecture:** PyTorch ResNet18 (`torchvision.models.resnet18(weights=None)`) with `model.fc = nn.Linear(512, 3)`
- **Trained Classes:** `["Healthy", "Powdery", "Rust"]` (Order must match this exact sequence!)
- **Preprocessing:** Trained using `Resize((224, 224))` and `ToTensor()`. No ImageNet normalization.
- **Accuracy baseline:** 94% test accuracy.

### 2. Pest Object Detection Model (Ultralytics YOLO)
- **Filename:** `pest_best.pt`
- **Framework:** Ultralytics YOLOv8
- **Format:** PyTorch YOLO export (`.pt`)
- **Note:** If this file is not yet placed here, the system gracefully reports:
  *"Pest detection model not configured"* without breaking disease prediction or faking detections.
