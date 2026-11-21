import uuid
import logging
from datetime import datetime
from pathlib import Path
from io import BytesIO
from typing import Optional

from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import FileResponse, JSONResponse
from PIL import Image

from app.config import settings
from app.schemas.schemas import (
    HealthResponse,
    ModelHealthInfo,
    PredictResponse,
    DiseasePrediction,
    PestDetectionResult,
    PestDetectionItem,
    AnalysisSummary,
    FarmerLoginRequest,
    FarmerProfile,
)
from app.models.disease_model import disease_classifier
from app.models.pest_model import pest_detector
from app.recommendations import generate_recommendations

logger = logging.getLogger("plant_ai.api")
router = APIRouter()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

@router.get("/health", response_model=HealthResponse)
def get_health():
    """
    Checks backend service status and current model loading states.
    """
    return HealthResponse(
        status="ok",
        version="1.0.0",
        disease_model=ModelHealthInfo(
            loaded=disease_classifier.is_loaded,
            path=str(disease_classifier.model_path),
            device=str(disease_classifier.device),
            classes=disease_classifier.classes,
            details=disease_classifier.load_error if not disease_classifier.is_loaded else "ResNet18 operational"
        ),
        pest_model=ModelHealthInfo(
            loaded=pest_detector.is_loaded,
            path=str(pest_detector.model_path),
            device=str(pest_detector.device) if hasattr(pest_detector, "device") else "auto",
            classes=pest_detector.classes if pest_detector.is_loaded else None,
            details=pest_detector.load_error if not pest_detector.is_loaded else f"Pest model ({pest_detector.model_type.upper() if pest_detector.model_type else 'AI'}) operational with {len(pest_detector.classes)} classes"
        )
    )

@router.post("/models/reload")
def reload_models():
    """
    Allows reloading weights from disk dynamically when new checkpoints are placed.
    """
    disease_loaded = disease_classifier.load_model()
    pest_loaded = pest_detector.load_model()
    return {
        "message": "Model recheck executed",
        "disease_model_loaded": disease_loaded,
        "pest_model_loaded": pest_loaded,
    }

@router.post("/auth/login", response_model=FarmerProfile)
def farmer_login(payload: FarmerLoginRequest):
    """
    Farmer authentication via Mobile Number and User ID.
    Supports easy entry for farmers, agricultural officers, and project evaluators.
    """
    clean_user_id = payload.user_id.strip()
    clean_mobile = payload.mobile_number.strip()

    if not clean_user_id:
        raise HTTPException(status_code=400, detail="Farmer / User ID is required.")
    
    # Basic mobile length validation (e.g. 10 digits or standard format)
    digits_only = "".join(filter(str.isdigit, clean_mobile))
    if len(digits_only) < 7:
        raise HTTPException(
            status_code=400,
            detail="Please provide a valid contact mobile number (minimum 7 digits)."
        )

    # Generate a friendly farmer name from user ID or default
    formatted_name = f"Farmer {clean_user_id.upper()}"
    token = f"farmer_token_{uuid.uuid4().hex[:12]}"

    return FarmerProfile(
        user_id=clean_user_id,
        mobile_number=clean_mobile,
        name=formatted_name,
        role="Registered Agricultural Grower",
        region="Agro-Ecological Field Zone",
        token=token
    )

@router.post("/predict", response_model=PredictResponse)
async def predict_plant_image(file: UploadFile = File(...)):
    """
    Accepts one plant image via multipart/form-data.
    Runs disease classification (ResNet18) and pest detection (YOLOv8).
    Saves original and annotated images to persistent result storage.
    """
    # 1. Validate MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{file.content_type}'. Please upload JPG, PNG, or WEBP."
        )

    # 2. Read bytes and validate size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 10 MB limit. Please compress or resize your image."
        )

    # 3. Open image with Pillow to verify it's a valid image
    try:
        pil_image = Image.open(BytesIO(contents))
        pil_image.verify()
        # Re-open for actual processing since verify() closes/invalidates the stream
        pil_image = Image.open(BytesIO(contents))
    except Exception as e:
        logger.warning(f"Corrupt or unreadable image upload: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is not a valid or readable image."
        )

    result_id = str(uuid.uuid4())
    result_dir = settings.STORAGE_DIR / result_id
    result_dir.mkdir(parents=True, exist_ok=True)

    # 4. Save original image
    original_path = result_dir / "original.jpg"
    try:
        # Save as standard JPEG
        if pil_image.mode in ("RGBA", "P"):
            rgb_img = pil_image.convert("RGB")
            rgb_img.save(original_path, format="JPEG", quality=92)
        else:
            pil_image.save(original_path, format="JPEG", quality=92)
    except Exception as e:
        logger.error(f"Failed to save original image: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to store uploaded image on server.")

    # 5. Run Disease Classification
    disease_result_raw = disease_classifier.predict(pil_image)
    disease_pred = DiseasePrediction(**disease_result_raw)

    # 6. Run Pest Detection
    annotated_path = result_dir / "annotated.jpg"
    pest_result_raw = pest_detector.detect(pil_image, save_annotated_path=annotated_path)

    annotated_url = None
    if pest_result_raw.get("available") and annotated_path.exists():
        annotated_url = f"/api/results/{result_id}/annotated"

    pest_detections = [
        PestDetectionItem(**item) for item in pest_result_raw.get("detections", [])
    ]
    pest_pred = PestDetectionResult(
        available=pest_result_raw.get("available", False),
        count=pest_result_raw.get("count", 0),
        detections=pest_detections,
        annotated_image_url=annotated_url,
        message=pest_result_raw.get("message")
    )

    # 7. Generate cautious agronomic recommendations
    pest_names = [d.class_name for d in pest_detections]
    recommendations_list = generate_recommendations(
        disease_class=disease_pred.class_name if disease_pred.available else None,
        disease_uncertain=disease_pred.uncertain,
        pest_count=pest_pred.count,
        pest_names=pest_names
    )

    # 8. Compile summary
    disease_status_text = (
        f"{disease_pred.disease_name or disease_pred.class_name} ({int((disease_pred.confidence or 0) * 100)}%)"
        if disease_pred.available and disease_pred.class_name
        else (disease_classifier.load_error or "Disease model not loaded")
    )

    pest_status_text = (
        f"{pest_pred.count} pest(s) detected"
        if pest_pred.available
        else "Pest detection model not configured"
    )

    overall_status = "Analysis Completed Successfully"
    if not disease_pred.available and not pest_pred.available:
        overall_status = "Models Pending Configuration"
    elif not disease_pred.available:
        overall_status = "Disease Model Pending Configuration"
    elif not pest_pred.available:
        overall_status = "Disease Diagnosed (Pest Model Not Configured)"

    verification_advisory = (
        "AI output is advisory. Physical sample confirmation is recommended before chemical or cultural intervention."
    )

    summary_obj = AnalysisSummary(
        disease_status=disease_status_text,
        pest_status=pest_status_text,
        total_pests_detected=pest_pred.count,
        overall_status=overall_status,
        verification_advisory=verification_advisory
    )

    return PredictResponse(
        result_id=result_id,
        created_at=datetime.utcnow().isoformat() + "Z",
        filename=file.filename or "plant_leaf.jpg",
        original_image_url=f"/api/results/{result_id}/original",
        disease=disease_pred,
        pest_detection=pest_pred,
        recommendations=recommendations_list,
        summary=summary_obj
    )

@router.get("/results/{result_id}/annotated")
def get_annotated_image(result_id: str):
    """
    Returns the YOLO annotated image with bounding boxes.
    """
    annotated_path = settings.STORAGE_DIR / result_id / "annotated.jpg"
    if not annotated_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Annotated image not found for this result or pest detection was not run."
        )
    return FileResponse(annotated_path, media_type="image/jpeg", filename=f"annotated_{result_id}.jpg")

@router.get("/results/{result_id}/original")
def get_original_image(result_id: str):
    """
    Returns the uploaded original plant image.
    """
    original_path = settings.STORAGE_DIR / result_id / "original.jpg"
    if not original_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Original image not found for this result."
        )
    return FileResponse(original_path, media_type="image/jpeg", filename=f"original_{result_id}.jpg")
