from typing import Optional, Any
from pydantic import BaseModel, Field

class DiseasePrediction(BaseModel):
    available: bool
    class_name: Optional[str] = None
    disease_name: Optional[str] = None
    scientific_name: Optional[str] = None
    pathogen_type: Optional[str] = None
    symptoms: Optional[str] = None
    confidence: Optional[float] = None
    probabilities: Optional[dict[str, float]] = None
    explanation: Optional[str] = None
    uncertain: bool = False
    warning: Optional[str] = None
    baseline_accuracy: float = 0.84
    message: Optional[str] = None

class PestDetectionItem(BaseModel):
    class_name: str
    confidence: float
    bbox: list[float] = Field(description="[x1, y1, x2, y2] in pixel coordinates")

class PestDetectionResult(BaseModel):
    available: bool
    count: int = 0
    detections: list[PestDetectionItem] = []
    annotated_image_url: Optional[str] = None
    message: Optional[str] = None

class RecommendationItem(BaseModel):
    title: str
    details: str
    category: str

class AnalysisSummary(BaseModel):
    disease_status: str
    pest_status: str
    total_pests_detected: int
    overall_status: str
    verification_advisory: str

class PredictResponse(BaseModel):
    result_id: str
    created_at: str
    filename: str
    original_image_url: str
    disease: DiseasePrediction
    pest_detection: PestDetectionResult
    recommendations: list[RecommendationItem]
    summary: AnalysisSummary

class ModelHealthInfo(BaseModel):
    loaded: bool
    path: str
    device: Optional[str] = None
    classes: Optional[list[str]] = None
    details: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    disease_model: ModelHealthInfo
    pest_model: ModelHealthInfo
    version: str

class FarmerLoginRequest(BaseModel):
    user_id: str
    mobile_number: str

class FarmerProfile(BaseModel):
    user_id: str
    mobile_number: str
    name: str
    role: str = "Agricultural Producer / Farmer"
    region: str = "District Farm Station"
    token: str
