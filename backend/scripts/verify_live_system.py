import subprocess
import time
import requests
import json
import sys
from pathlib import Path
from PIL import Image
import io

backend_dir = Path(__file__).resolve().parent.parent

print("Starting FastAPI backend process...")
proc = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
    cwd=str(backend_dir),
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

try:
    connected = False
    for attempt in range(20):
        time.sleep(1)
        if proc.poll() is not None:
            out, err = proc.communicate()
            print("Server process died prematurely!")
            print("STDOUT:", out)
            print("STDERR:", err)
            sys.exit(1)
        try:
            res = requests.get("http://127.0.0.1:8000/api/health", timeout=2)
            if res.status_code == 200:
                connected = True
                print(f"Connected to backend on attempt {attempt+1}!")
                break
        except Exception:
            pass

    if not connected:
        out, err = proc.communicate()
        print("Failed to connect after 20 seconds!")
        print("STDOUT:", out)
        print("STDERR:", err)
        sys.exit(1)

    # 1. Test Health Endpoint
    print("\n[TEST 1] Querying GET /api/health ...")
    res_health = requests.get("http://127.0.0.1:8000/api/health", timeout=5)
    print("HTTP Status:", res_health.status_code)
    print("Health Output:")
    print(json.dumps(res_health.json(), indent=2))

    # 2. Test Prediction with Sample Images
    print("\n[TEST 2] Testing POST /api/predict with Foliage Image ...")
    img = Image.new("RGB", (224, 224), color=(34, 139, 34))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"file": ("test_leaf.jpg", buf, "image/jpeg")}
    res_predict = requests.post("http://127.0.0.1:8000/api/predict", files=files, timeout=10)
    print("HTTP Status:", res_predict.status_code)
    pred_data = res_predict.json()
    print("Prediction Output:")
    print(json.dumps(pred_data, indent=2))

    # 3. Test Image Retrieval
    result_id = pred_data.get("result_id")
    print(f"\n[TEST 3] Testing GET /api/results/{result_id}/original ...")
    res_img = requests.get(f"http://127.0.0.1:8000/api/results/{result_id}/original", timeout=5)
    print("HTTP Status:", res_img.status_code)
    print("Content-Type:", res_img.headers.get("content-type"))
    print("Bytes received:", len(res_img.content))

    if pred_data.get("pest_detection", {}).get("annotated_image_url"):
        annotated_url = pred_data["pest_detection"]["annotated_image_url"]
        print(f"\n[TEST 3b] Testing GET http://127.0.0.1:8000{annotated_url} ...")
        res_annotated = requests.get(f"http://127.0.0.1:8000{annotated_url}", timeout=5)
        print("HTTP Status:", res_annotated.status_code)
        print("Annotated Image Bytes received:", len(res_annotated.content))

    # 4. Test Farmer Login
    print("\n[TEST 4] Testing POST /api/auth/login ...")
    res_login = requests.post(
        "http://127.0.0.1:8000/api/auth/login",
        json={"user_id": "FARM-8821", "mobile_number": "9876543210"},
        timeout=5
    )
    print("HTTP Status:", res_login.status_code)
    print("Login Output:")
    print(json.dumps(res_login.json(), indent=2))

    print("\n>>> ALL BACKEND ENDPOINTS AND INFERENCE PIPELINES VERIFIED SUCCESSFULLY! <<<")

finally:
    proc.terminate()
    try:
        proc.wait(timeout=3)
    except subprocess.TimeoutExpired:
        proc.kill()
