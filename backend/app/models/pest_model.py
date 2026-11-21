import logging
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
from PIL import Image, ImageDraw
import numpy as np
import torch
import torch.nn as nn
from torchvision import models, transforms

from app.config import settings

logger = logging.getLogger("plant_ai.pest_model")

# 12 Agricultural Pest Classes (Alphabetical order standard in torchvision ImageFolder)
PEST_CLASSES = [
    "Ants", "Bees", "Beetles", "Caterpillars", "Earthworms", "Earwigs",
    "Grasshoppers", "Moths", "Slugs", "Snails", "Wasps", "Weevils"
]

class PestDetector:
    """
    Dual-engine Pest Detection System supporting:
    1. PyTorch ResNet-18 Pest Classifier (.pth) - 12 Agricultural Pest Classes
    2. Ultralytics YOLO Object Detector (.pt) - Bounding Box Localization
    """
    def __init__(self, model_path: Optional[Path] = None, conf_threshold: Optional[float] = None):
        self.conf_threshold = conf_threshold if conf_threshold is not None else settings.PEST_CONFIDENCE_THRESHOLD
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.model_type: Optional[str] = None  # 'resnet18' or 'yolo'
        self.is_loaded: bool = False
        self.load_error: Optional[str] = None
        self.classes: List[str] = PEST_CLASSES
        
        # Resolve model path
        self.model_path = self._resolve_model_path(model_path)
        
        # ResNet transforms
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        
        self.load_model()

    def _resolve_model_path(self, path: Optional[Path]) -> Path:
        """Finds active pest model path (.pth or .pt)"""
        candidates = []
        if path:
            candidates.append(path)
        if settings.PEST_MODEL_PATH:
            candidates.append(settings.PEST_MODEL_PATH)
            
        backend_models = settings.STORAGE_DIR.parent.parent / "models"
        candidates.extend([
            backend_models / "pest_resnet18.pth",
            backend_models / "pest_best.pt",
            backend_models / "pest_model.pth",
            backend_models / "pest_yolo.pt"
        ])
        
        for cand in candidates:
            if cand and cand.exists():
                return cand
        return settings.PEST_MODEL_PATH

    def load_model(self) -> bool:
        """
        Loads the pest model. Automatically detects whether it is PyTorch ResNet18 or Ultralytics YOLO.
        """
        # Re-resolve if needed
        if not self.model_path or not self.model_path.exists():
            self.model_path = self._resolve_model_path(None)

        if not self.model_path.exists():
            self.is_loaded = False
            self.load_error = f"Pest model weights not found at: {self.model_path}"
            logger.info(f"{self.load_error}. Pest detection reported as unconfigured.")
            return False

        # Check suffix
        suffix = self.model_path.suffix.lower()
        
        if suffix in (".pth", ".pt"):
            # Check if it's a PyTorch state_dict for ResNet18
            try:
                ckpt = torch.load(self.model_path, map_location="cpu")
                if isinstance(ckpt, dict) and ("fc.weight" in ckpt or "layer1.0.conv1.weight" in ckpt or "state_dict" in ckpt):
                    # It's a PyTorch ResNet classification checkpoint!
                    state_dict = ckpt.get("state_dict", ckpt)
                    num_classes = len(self.classes)
                    if "fc.weight" in state_dict:
                        num_classes = state_dict["fc.weight"].shape[0]
                    
                    model = models.resnet18(weights=None)
                    model.fc = nn.Linear(model.fc.in_features, num_classes)
                    model.load_state_dict(state_dict)
                    model.to(self.device)
                    model.eval()
                    
                    self.model = model
                    self.model_type = "resnet18"
                    self.is_loaded = True
                    self.load_error = None
                    logger.info(f"Loaded PyTorch ResNet18 Pest Model ({num_classes} classes) from {self.model_path} on {self.device}")
                    return True
            except Exception as e:
                logger.debug(f"Not a standard PyTorch state_dict, attempting YOLO: {e}")

        # Try loading as Ultralytics YOLO
        try:
            from ultralytics import YOLO
            self.model = YOLO(str(self.model_path))
            self.model_type = "yolo"
            self.is_loaded = True
            self.load_error = None
            if hasattr(self.model, "names") and isinstance(self.model.names, dict):
                self.classes = list(self.model.names.values())
            logger.info(f"Loaded Ultralytics YOLO pest model from {self.model_path}")
            return True
        except Exception as e:
            self.is_loaded = False
            self.load_error = f"Failed to load pest weights as PyTorch or YOLO: {str(e)}"
            logger.error(self.load_error, exc_info=True)
            return False

    def detect(self, pil_image: Image.Image, save_annotated_path: Optional[Path] = None) -> Dict[str, Any]:
        """
        Runs pest detection using either YOLO object detection or ResNet-18 classification.
        Generates annotated image with bounding boxes or diagnostic tags.
        """
        if not self.is_loaded or self.model is None:
            return {
                "available": False,
                "count": 0,
                "detections": [],
                "annotated_image_url": None,
                "message": "Pest detection model not configured. Place pest_resnet18.pth or pest_best.pt in backend/models.",
            }

        try:
            if pil_image.mode != "RGB":
                pil_image = pil_image.convert("RGB")

            img_w, img_h = pil_image.size

            if self.model_type == "resnet18":
                return self._detect_resnet(pil_image, img_w, img_h, save_annotated_path)
            elif self.model_type == "yolo":
                return self._detect_yolo(pil_image, save_annotated_path)
            else:
                raise ValueError(f"Unknown model type: {self.model_type}")

        except Exception as e:
            logger.error(f"Inference error in pest detection: {str(e)}", exc_info=True)
            raise RuntimeError(f"Error during pest detection: {str(e)}")

    def _detect_resnet(self, pil_image: Image.Image, img_w: int, img_h: int, save_annotated_path: Optional[Path]) -> Dict[str, Any]:
        """Runs ResNet18 pest classification inference and generates annotated image"""
        tensor = self.transform(pil_image).unsqueeze(0).to(self.device)

        with torch.inference_mode():
            outputs = self.model(tensor)
            probs = torch.softmax(outputs, dim=1)[0].cpu().numpy()

        # Update threshold from config dynamically
        self.conf_threshold = settings.PEST_CONFIDENCE_THRESHOLD

        pred_idx = int(probs.argmax())
        confidence = float(probs[pred_idx])
        pest_name = self.classes[pred_idx] if pred_idx < len(self.classes) else f"Pest_{pred_idx}"

        detections = []
        # If confidence is above threshold, record pest instance
        if confidence >= self.conf_threshold:
            # Region of interest box around central foliage area
            pad_x = int(img_w * 0.12)
            pad_y = int(img_h * 0.12)
            bbox = [float(pad_x), float(pad_y), float(img_w - pad_x), float(img_h - pad_y)]
            
            detections.append({
                "class_name": pest_name,
                "confidence": round(confidence, 4),
                "bbox": [round(c, 1) for c in bbox]
            })

        count = len(detections)

        # Generate annotated image
        if save_annotated_path:
            annotated = pil_image.copy()
            draw = ImageDraw.Draw(annotated)
            
            if count > 0:
                # Draw bounding box and label
                bx1, by1, bx2, by2 = detections[0]["bbox"]
                box_color = (220, 38, 38) # Crimson Red
                
                # Draw box border (3px)
                for thickness in range(4):
                    draw.rectangle([bx1 - thickness, by1 - thickness, bx2 + thickness, by2 + thickness], outline=box_color)
                
                # Draw text badge
                label_text = f"Pest: {pest_name} ({confidence * 100:.1f}%)"
                badge_h = 30
                badge_w = min(img_w - 20, len(label_text) * 11 + 24)
                draw.rectangle([bx1, max(0, by1 - badge_h), bx1 + badge_w, by1], fill=box_color)
                draw.text((bx1 + 8, max(2, by1 - badge_h + 6)), label_text, fill=(255, 255, 255))
            else:
                # Draw green badge indicating clear foliage
                badge_text = "No Pests Detected Above Threshold"
                draw.rectangle([16, 16, 320, 48], fill=(22, 101, 52))
                draw.text((26, 24), badge_text, fill=(255, 255, 255))

            save_annotated_path.parent.mkdir(parents=True, exist_ok=True)
            annotated.save(save_annotated_path, format="JPEG", quality=90)

        message = None
        if count == 0:
            top_classes = sorted(zip(self.classes, probs), key=lambda x: x[1], reverse=True)[:3]
            top_str = ", ".join([f"{c} ({p*100:.1f}%)" for c, p in top_classes])
            message = f"No pest detected above {int(self.conf_threshold * 100)}% confidence threshold. Closest candidates: {top_str}."

        return {
            "available": True,
            "count": count,
            "detections": detections,
            "message": message,
        }

    def _detect_yolo(self, pil_image: Image.Image, save_annotated_path: Optional[Path]) -> Dict[str, Any]:
        """Runs Ultralytics YOLO object detection"""
        results = self.model.predict(
            source=pil_image,
            conf=self.conf_threshold,
            verbose=False
        )

        detections: List[Dict[str, Any]] = []
        result_item = results[0] if len(results) > 0 else None

        if result_item and result_item.boxes is not None and len(result_item.boxes) > 0:
            for box in result_item.boxes:
                cls_id = int(box.cls[0].item())
                cls_name = self.model.names.get(cls_id, f"pest_{cls_id}")
                conf = float(box.conf[0].item())
                xyxy = [round(float(coord), 1) for coord in box.xyxy[0].tolist()]

                detections.append({
                    "class_name": cls_name,
                    "confidence": round(conf, 4),
                    "bbox": xyxy
                })

        if save_annotated_path and result_item is not None:
            annotated_bgr = result_item.plot()
            annotated_rgb = annotated_bgr[:, :, ::-1]
            annotated_pil = Image.fromarray(annotated_rgb)
            save_annotated_path.parent.mkdir(parents=True, exist_ok=True)
            annotated_pil.save(save_annotated_path, format="JPEG", quality=90)

        count = len(detections)
        message = None
        if count == 0:
            message = f"No agricultural pests detected above the confidence threshold ({self.conf_threshold * 100:.0f}%)."

        return {
            "available": True,
            "count": count,
            "detections": detections,
            "message": message,
        }

# Singleton instance
pest_detector = PestDetector()
