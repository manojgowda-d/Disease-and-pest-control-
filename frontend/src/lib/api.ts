// Frontend API client for AI Plant Disease and Pest Detection System

export interface DiseasePrediction {
  available: boolean;
  class_name: "Healthy" | "Powdery" | "Rust" | null;
  disease_name?: string | null;
  scientific_name?: string | null;
  pathogen_type?: string | null;
  symptoms?: string | null;
  confidence: number | null;
  probabilities: Record<string, number> | null;
  explanation: string | null;
  uncertain: boolean;
  warning: string | null;
  baseline_accuracy: number;
  message: string | null;
}

export interface PestDetectionItem {
  class_name: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
}

export interface PestDetectionResult {
  available: boolean;
  count: number;
  detections: PestDetectionItem[];
  annotated_image_url: string | null;
  message: string | null;
}

export interface RecommendationItem {
  category: string;
  title: string;
  details: string;
}

export interface AnalysisSummary {
  disease_status: string;
  pest_status: string;
  total_pests_detected: number;
  overall_status: string;
  verification_advisory: string;
}

export interface PredictResponse {
  result_id: string;
  created_at: string;
  filename: string;
  original_image_url: string;
  disease: DiseasePrediction;
  pest_detection: PestDetectionResult;
  recommendations: RecommendationItem[];
  summary: AnalysisSummary;
}

export interface ModelHealthInfo {
  loaded: boolean;
  path: string;
  device?: string;
  classes?: string[];
  details?: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  disease_model: ModelHealthInfo;
  pest_model: ModelHealthInfo;
}

export interface FarmerProfile {
  user_id: string;
  mobile_number: string;
  name: string;
  role: string;
  region: string;
  token: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Fetches the backend operational status and model readiness.
 */
export async function getHealthStatus(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/health`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Health check failed with HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Uploads a plant leaf image for disease classification and pest detection.
 */
export async function analyzePlantImage(file: File): Promise<PredictResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/predict`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let errorDetail = `Server responded with HTTP ${res.status}`;
    try {
      const errorJson = await res.json();
      if (errorJson.detail) {
        errorDetail = errorJson.detail;
      }
    } catch {
      // fallback to status text
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

/**
 * Logs in a farmer using their User ID and Mobile Number.
 */
export async function loginFarmer(userId: string, mobileNumber: string): Promise<FarmerProfile> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, mobile_number: mobileNumber }),
  });

  if (!res.ok) {
    let errMessage = "Login failed";
    try {
      const data = await res.json();
      if (data.detail) errMessage = data.detail;
    } catch {
      // fallback
    }
    throw new Error(errMessage);
  }

  return res.json();
}

/**
 * Constructs the absolute URL for an annotated image.
 */
export function getAnnotatedImageUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  return `${API_BASE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

/**
 * Constructs the absolute URL for an original uploaded image.
 */
export function getOriginalImageUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  return `${API_BASE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

/**
 * Triggers backend to reload models from disk without restarting server.
 */
export async function reloadBackendModels(): Promise<{
  message: string;
  disease_model_loaded: boolean;
  pest_model_loaded: boolean;
}> {
  const res = await fetch(`${API_BASE_URL}/api/models/reload`, {
    method: "POST",
  });
  return res.json();
}
