import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any
from PIL import Image

import torch
import torch.nn as nn
from torchvision import models, transforms

from app.config import settings

logger = logging.getLogger("plant_ai.disease_model")

class DiseaseClassifier:
    """
    PyTorch ResNet-18 Disease Classifier for Plant Pathology.
    Classes: ['Healthy', 'Powdery', 'Rust']
    Preprocessing: Resize((224, 224)), ToTensor() without ImageNet normalization.
    """
    def __init__(self, model_path: Optional[Path] = None):
        self.model_path = model_path or settings.DISEASE_MODEL_PATH
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.classes = settings.DISEASE_CLASSES
        self.model: Optional[nn.Module] = None
        self.is_loaded: bool = False
        self.load_error: Optional[str] = None
        
        # Preprocessing matching the exact training configuration:
        # Resize((224, 224)) and ToTensor() without ImageNet normalization
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
        ])
        
        self.load_model()

    def build_architecture(self) -> nn.Module:
        """
        Recreates the ResNet18 architecture with a 3-class output layer.
        """
        model = models.resnet18(weights=None)
        in_features = model.fc.in_features
        model.fc = nn.Linear(in_features, len(self.classes))
        return model

    def load_model(self) -> bool:
        """
        Loads the model weights from the specified path.
        If file does not exist or fails, records error and keeps available=False.
        """
        if not self.model_path.exists():
            self.is_loaded = False
            self.load_error = f"Model checkpoint not found at: {self.model_path}"
            logger.warning(self.load_error)
            return False

        try:
            model = self.build_architecture()
            # Load weights safely onto selected device
            state_dict = torch.load(self.model_path, map_location=self.device)
            
            # Handle state dict if wrapped inside 'state_dict' or 'model' key
            if isinstance(state_dict, dict) and "state_dict" in state_dict:
                state_dict = state_dict["state_dict"]
            elif isinstance(state_dict, dict) and "model" in state_dict:
                state_dict = state_dict["model"]
                
            model.load_state_dict(state_dict)
            model.to(self.device)
            model.eval()
            self.model = model
            self.is_loaded = True
            self.load_error = None
            logger.info(f"Loaded ResNet18 disease model from {self.model_path} on {self.device}")
            return True
        except Exception as e:
            self.is_loaded = False
            self.load_error = f"Failed to load checkpoint: {str(e)}"
            logger.error(self.load_error, exc_info=True)
            return False

    def predict(self, pil_image: Image.Image) -> Dict[str, Any]:
        """
        Runs inference on a PIL image using model.eval() and torch.inference_mode().
        """
        if not self.is_loaded or self.model is None:
            return {
                "available": False,
                "message": self.load_error or "Disease model weights not loaded. Please configure disease_resnet18.pth.",
                "class_name": None,
                "confidence": None,
                "probabilities": None,
                "explanation": None,
                "uncertain": False,
                "warning": "Model checkpoint not loaded.",
                "baseline_accuracy": settings.DISEASE_BASELINE_ACCURACY,
            }

        try:
            # Ensure RGB format
            if pil_image.mode != "RGB":
                pil_image = pil_image.convert("RGB")

            # Apply training transforms: Resize((224, 224)) -> ToTensor()
            input_tensor = self.transform(pil_image)
            # Add batch dimension: [1, 3, 224, 224]
            input_tensor = input_tensor.unsqueeze(0).to(self.device)

            with torch.inference_mode():
                outputs = self.model(input_tensor)
                # Compute probabilities using softmax
                probabilities = torch.softmax(outputs, dim=1)[0].cpu().numpy()

            pred_index = int(probabilities.argmax())
            confidence = float(probabilities[pred_index])
            predicted_class = self.classes[pred_index]

            prob_dict = {
                cls_name: round(float(prob), 4)
                for cls_name, prob in zip(self.classes, probabilities)
            }

            # Check for uncertainty
            is_uncertain = confidence < settings.UNCERTAINTY_THRESHOLD
            warning_msg = None
            if is_uncertain:
                warning_msg = (
                    f"Model confidence ({confidence * 100:.1f}%) is below the {int(settings.UNCERTAINTY_THRESHOLD * 100)}% "
                    "certainty threshold. Visual inspection or agricultural officer verification is strongly recommended."
                )

            disease_metadata = {
                "Healthy": {
                    "disease_name": "Healthy Plant (No Disease Detected)",
                    "scientific_name": "Non-pathological / Healthy Tissue",
                    "pathogen_type": "None (Healthy Chlorophyll Foliage)",
                    "symptoms": "Uniform green coloration, intact leaf cuticle, absence of fungal lesions, powder, or sporulating pustules.",
                    "explanation": "Plant foliage exhibits normal physiological vitality with typical chlorophyll density and no discernible signs of foliar infection."
                },
                "Powdery": {
                    "disease_name": "Powdery Mildew Disease",
                    "scientific_name": "Erysiphe / Podosphaera / Golovinomyces spp. (Order: Erysiphales)",
                    "pathogen_type": "Biotrophic Ascomycete Fungus",
                    "symptoms": "Superficial white to dusty-gray powdery patches of epiphytic fungal mycelium and conidiophores spreading across the adaxial leaf surface.",
                    "explanation": "Pathological characteristics correspond specifically to Powdery Mildew fungal infection, which colonizes epidermal leaf cells and impairs photosynthetic radiation."
                },
                "Rust": {
                    "disease_name": "Plant Rust Fungal Disease",
                    "scientific_name": "Puccinia / Uromyces spp. (Order: Pucciniales)",
                    "pathogen_type": "Obligate Biotrophic Basidiomycete Fungus",
                    "symptoms": "Elevated reddish-brown, orange, or yellow-brown powdery pustules (uredinia) that rupture the epidermal leaf cuticle and release windborne spores.",
                    "explanation": "Pathological characteristics correspond specifically to Plant Rust fungus disease, marked by blistering pustules that disrupt transpiration and cellular water retention."
                }
            }

            meta = disease_metadata.get(predicted_class, {
                "disease_name": predicted_class,
                "scientific_name": "Botanical / Fungal Pathogen",
                "pathogen_type": "Foliar Pathogen",
                "symptoms": "Visible foliar symptoms detected.",
                "explanation": "Standard plant pathology classification."
            })

            return {
                "available": True,
                "class_name": predicted_class,
                "disease_name": meta["disease_name"],
                "scientific_name": meta["scientific_name"],
                "pathogen_type": meta["pathogen_type"],
                "symptoms": meta["symptoms"],
                "confidence": round(confidence, 4),
                "probabilities": prob_dict,
                "explanation": meta["explanation"],
                "uncertain": is_uncertain,
                "warning": warning_msg,
                "baseline_accuracy": settings.DISEASE_BASELINE_ACCURACY,
                "message": None,
            }

        except Exception as e:
            logger.error(f"Inference error in disease classification: {str(e)}", exc_info=True)
            raise RuntimeError(f"Error during disease classification: {str(e)}")

# Singleton instance for app lifetime
disease_classifier = DiseaseClassifier()
