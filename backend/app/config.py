import os
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

try:
    from dotenv import load_dotenv
    BACKEND_DIR = Path(__file__).resolve().parent.parent
    load_dotenv(BACKEND_DIR / ".env")
except ImportError:
    BACKEND_DIR = Path(__file__).resolve().parent.parent
    env_file = BACKEND_DIR / ".env"
    if env_file.exists():
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k, v = k.strip(), v.strip().strip("\"'")
                    if k not in os.environ:
                        os.environ[k] = v

class Settings(BaseModel):
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")
    
    # CORS
    CORS_ORIGINS: list[str] = [
        origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",") if origin.strip()
    ]
    
    # Models
    DISEASE_MODEL_PATH: Path = (
        Path(os.getenv("DISEASE_MODEL_PATH", "models/disease_resnet18.pth"))
        if Path(os.getenv("DISEASE_MODEL_PATH", "models/disease_resnet18.pth")).is_absolute()
        else BACKEND_DIR / os.getenv("DISEASE_MODEL_PATH", "models/disease_resnet18.pth")
    )
    
    PEST_MODEL_PATH: Path = (
        Path(os.getenv("PEST_MODEL_PATH", "models/pest_best.pt"))
        if Path(os.getenv("PEST_MODEL_PATH", "models/pest_best.pt")).is_absolute()
        else BACKEND_DIR / os.getenv("PEST_MODEL_PATH", "models/pest_best.pt")
    )
    
    PEST_CONFIDENCE_THRESHOLD: float = float(os.getenv("PEST_CONFIDENCE_THRESHOLD", "0.12"))
    UNCERTAINTY_THRESHOLD: float = float(os.getenv("UNCERTAINTY_THRESHOLD", "0.60"))
    
    # Storage
    STORAGE_DIR: Path = (
        Path(os.getenv("STORAGE_DIR", "storage/results"))
        if Path(os.getenv("STORAGE_DIR", "storage/results")).is_absolute()
        else BACKEND_DIR / os.getenv("STORAGE_DIR", "storage/results")
    )
    
    # Fixed class order as trained
    DISEASE_CLASSES: list[str] = ["Healthy", "Powdery", "Rust"]
    DISEASE_BASELINE_ACCURACY: float = 0.84

settings = Settings()

# Ensure storage directory exists
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
