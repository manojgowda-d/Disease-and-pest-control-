# AI-Based Plant Disease and Pest Detection System Using Computer Vision

A full-stack, responsive computer vision web application for automated crop disease classification and pest object detection. Built for agricultural researchers, farmers, and college project evaluation.

---

## 🌾 System Architecture & Technologies

### Frontend
- **Framework:** Next.js (App Router) with TypeScript
- **Styling:** Tailwind CSS (Nature-inspired agricultural theme)
- **Icons:** Lucide React
- **Features:** Drag-and-drop file upload, instant image preview, dual-view annotated visualizer, class probability distribution charts, farmer authentication, and printable diagnostic reports.

### Backend
- **Engine:** Python with FastAPI REST API
- **Disease Classification:** PyTorch & Torchvision ResNet18 (Trained on Plant Disease Recognition Dataset)
  - **Classes:** `["Healthy", "Powdery", "Rust"]` (Exact 3-class order)
  - **Preprocessing:** `Resize((224, 224))` and `ToTensor()` without ImageNet normalization (preserving model baseline)
  - **Measured Baseline Accuracy:** 84% test accuracy
- **Pest Object Detection:** Ultralytics YOLOv8
  - Detects agricultural insect pests and generates pixel bounding boxes `[x1, y1, x2, y2]`
  - Produces labeled visual annotated images
  - Gracefully reports *"Pest detection model not configured"* when weights are absent
- **Image Processing:** Pillow and OpenCV

---

## 📁 Project Directory Structure

```text
plant-ai-system/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx               # Home / Dashboard
│   │   │   ├── analyze/page.tsx       # Foliage Diagnostic Station
│   │   │   ├── login/page.tsx         # Farmer Access Portal
│   │   │   ├── layout.tsx             # Root layout with AuthProvider
│   │   │   └── globals.css            # Agricultural design theme
│   │   ├── components/
│   │   │   ├── Navbar.tsx             # Navigation & Live AI model monitor
│   │   │   ├── Footer.tsx             # Tech stack & AI advisory notice
│   │   │   ├── UploadDropzone.tsx     # Drag-and-drop upload & validation
│   │   │   ├── ResultsView.tsx        # Diagnostic report & image visualizer
│   │   │   └── WorkflowSection.tsx    # 3-step AI pipeline explanation
│   │   └── lib/
│   │       ├── api.ts                 # Typed REST client for FastAPI
│   │       └── auth-context.tsx       # Farmer session state
│   ├── package.json
│   ├── .env.example
│   └── .env.local
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI entry point & CORS
│   │   ├── config.py                  # Pydantic configuration & env parser
│   │   ├── recommendations.py         # Cautious agronomic care guidelines
│   │   ├── api/
│   │   │   └── routes.py              # /health, /predict, /results, /auth
│   │   ├── models/
│   │   │   ├── disease_model.py       # PyTorch ResNet18 inference engine
│   │   │   └── pest_model.py          # Ultralytics YOLOv8 detector
│   │   └── schemas/
│   │       └── schemas.py             # Pydantic domain models
│   ├── models/
│   │   ├── README.md                  # Checkpoint placement instructions
│   │   └── disease_resnet18.pth       # Trained disease model checkpoint
│   ├── scripts/
│   │   ├── generate_sample_checkpoint.py  # Checkpoint verification tool
│   │   └── test_predict.py            # CLI prediction test script
│   ├── storage/
│   │   └── results/                   # Persisted analysis images
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
├── README.md
└── .gitignore
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js:** v18 or higher (v20+ recommended)
- **Python:** 3.10 – 3.14 with `pip`
- **Operating System:** Windows, macOS, or Linux

---

### 2. Backend Setup & Startup

1. Open PowerShell or a terminal and navigate to the backend directory:
   ```powershell
   cd "backend"
   ```

2. Install Python dependencies:
   ```powershell
   python -m pip install -r requirements.txt
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```

4. Place your trained model weights:
   - **Disease Model:** Place `disease_resnet18.pth` in `backend/models/disease_resnet18.pth`
   - **Pest Model:** Place `pest_best.pt` in `backend/models/pest_best.pt`
   *(If you want to test before copying your weights, run `python scripts/generate_sample_checkpoint.py`)*

5. Start the FastAPI server:
   ```powershell
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

The backend is now operational at **`http://127.0.0.1:8000`**.  
Interactive Swagger API documentation is available at **`http://127.0.0.1:8000/docs`**.

---

### 3. Frontend Setup & Startup

1. Open a second PowerShell or terminal window and navigate to the frontend directory:
   ```powershell
   cd "frontend"
   ```

2. Install Node dependencies:
   ```powershell
   npm install
   ```

3. Configure environment variables:
   Ensure `frontend/.env.local` contains:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Start the Next.js development server:
   ```powershell
   npm run dev -- -p 3000
   ```

Open your browser and navigate to **`http://localhost:3000`**.

---

## 🧪 Testing the Health Endpoint

Verify that both the FastAPI server and your PyTorch model are ready:

### PowerShell
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/health" | ConvertTo-Json
```

### cURL
```bash
curl -X GET "http://127.0.0.1:8000/api/health"
```

### Expected Response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "disease_model": {
    "loaded": true,
    "path": "C:\\...\\backend\\models\\disease_resnet18.pth",
    "device": "cpu",
    "classes": ["Healthy", "Powdery", "Rust"],
    "details": "ResNet18 operational"
  },
  "pest_model": {
    "loaded": false,
    "path": "C:\\...\\backend\\models\\pest_best.pt",
    "device": "auto",
    "classes": null,
    "details": "Pest detection model weights not found at: backend/models/pest_best.pt"
  }
}
```

---

## 👨‍🌾 Farmer Authentication

The system includes a dedicated Farmer Login portal at `/login`:
- **Login Credentials:** Farmer / User ID and Mobile Number.
- **Evaluation Demo:** Click the **"Auto-fill"** button on the login screen to sign in instantly with demo credentials:
  - **User ID:** `FARM-8821`
  - **Mobile:** `9876543210`
- You can also continue as a **Guest Grower** without logging in.

---

## 🧠 Model Integration Details

### Disease Classification (ResNet18)
- File path: `backend/models/disease_resnet18.pth`
- The model architecture is reconstructed using `torchvision.models.resnet18(weights=None)` with the final fully connected layer modified:
  ```python
  model.fc = nn.Linear(model.fc.in_features, 3)
  ```
- Transformations applied during inference:
  ```python
  transforms.Compose([
      transforms.Resize((224, 224)),
      transforms.ToTensor()
  ])
  ```
- Uses `model.eval()` and `torch.inference_mode()` with automatic CUDA/CPU selection.

### Pest Object Detection (YOLOv8)
- File path: `backend/models/pest_best.pt`
- Configurable confidence threshold: `PEST_CONFIDENCE_THRESHOLD=0.35` in `.env`
- When weights are not yet present, the system returns `available: false` with the message:
  `"Pest detection model not configured"`. It never fabricates predictions.

---

## 🛠️ Troubleshooting

### 1. "Disease model weights not found"
- Verify that `disease_resnet18.pth` is placed directly in `backend/models/`.
- Ensure the filename in `backend/.env` matches `DISEASE_MODEL_PATH=models/disease_resnet18.pth`.
- You can trigger a live hot-reload without restarting the backend via `POST http://127.0.0.1:8000/api/models/reload`.

### 2. "Pest detection model not configured"
- This is normal if you have not yet supplied `pest_best.pt`. The disease classifier continues to work independently.
- Once trained, place `pest_best.pt` into `backend/models/` and reload.

### 3. "Failed to fetch / Network error" on frontend
- Ensure the backend is running on port 8000: `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`.
- Verify `CORS_ORIGINS` in `backend/.env` allows `http://localhost:3000`.
- Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`.

### 4. GPU / CUDA acceleration
- The backend automatically checks `torch.cuda.is_available()`. If an NVIDIA GPU with CUDA drivers is detected, PyTorch will automatically utilize `cuda`; otherwise, it smoothly falls back to `cpu`.

---

## 📜 Academic Capstone Disclaimer
*This application was developed as a college project: “AI-Based Plant Disease and Pest Detection Using Computer Vision”. All diagnostics and bounding boxes generated by deep learning models are advisory in nature. Field verification with agricultural extension officers is recommended before initiating chemical or significant agronomic treatments.*
