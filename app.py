"""
Waste Connect — ML Inference Service
Serves YOLO11 waste detection via FastAPI
Falls back to Claude Vision API if model unavailable
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64, os, io, httpx
from typing import Optional

app = FastAPI(title="Waste Connect ML Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Waste categories & metadata
WASTE_META = {
    "plastic":  {"points": 15, "color": "#3b82f6", "co2_kg": 0.30},
    "glass":    {"points": 20, "color": "#8b5cf6", "co2_kg": 0.20},
    "paper":    {"points": 10, "color": "#f59e0b", "co2_kg": 0.10},
    "metal":    {"points": 25, "color": "#6b7280", "co2_kg": 0.50},
    "organic":  {"points": 12, "color": "#10b981", "co2_kg": 0.05},
    "ewaste":   {"points": 30, "color": "#ef4444", "co2_kg": 0.80},
    "textile":  {"points": 18, "color": "#ec4899", "co2_kg": 0.40},
}

# Try loading YOLO11 model (optional — falls back to Claude API)
yolo_model = None
try:
    from ultralytics import YOLO
    MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "model/yolo11_waste.pt")
    if os.path.exists(MODEL_PATH):
        yolo_model = YOLO(MODEL_PATH)
        print(f"✅ YOLO11 model loaded from {MODEL_PATH}")
    else:
        print("⚠️  YOLO model not found — using Claude Vision API fallback")
except ImportError:
    print("⚠️  ultralytics not installed — using Claude Vision API fallback")

ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY", "")

class DetectRequest(BaseModel):
    image_base64: str
    mime_type:    str = "image/jpeg"

class DetectResponse(BaseModel):
    type:         str
    confidence:   float
    description:  str
    recyclable:   bool
    instructions: str
    tip:          str
    points:       int
    co2_saved_kg: float
    method:       str  # "yolo11" | "claude_vision"

async def detect_with_claude(image_b64: str, mime_type: str) -> dict:
    """Claude Vision API fallback for waste classification"""
    if not ANTHROPIC_KEY:
        raise ValueError("ANTHROPIC_API_KEY not set")

    system_prompt = """You are a precision waste classification AI.
Respond ONLY with a valid JSON object (no markdown) in this format:
{
  "type": "plastic|glass|paper|metal|organic|ewaste|textile",
  "confidence": 0.0-1.0,
  "description": "Brief description of the waste item seen",
  "recyclable": true|false,
  "instructions": "How to recycle or dispose of this item",
  "tip": "One eco-friendly tip for this waste type"
}"""

    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_KEY,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 500,
                "system": system_prompt,
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "image", "source": {"type": "base64", "media_type": mime_type, "data": image_b64}},
                        {"type": "text", "text": "Classify this waste item."}
                    ]
                }]
            }
        )
        data = res.json()
        import json
        text = data["content"][0]["text"]
        return json.loads(text.strip())

def detect_with_yolo(image_b64: str) -> dict:
    """YOLO11 inference"""
    from PIL import Image
    img_bytes = base64.b64decode(image_b64)
    img = Image.open(io.BytesIO(img_bytes))
    results = yolo_model(img)
    if not results or not results[0].boxes:
        return {"type": "plastic", "confidence": 0.5, "description": "Item detected", "recyclable": True,
                "instructions": "Place in recycling bin.", "tip": "Reduce single-use items."}
    box   = results[0].boxes[0]
    cls   = int(box.cls[0])
    conf  = float(box.conf[0])
    names = yolo_model.names
    label = names.get(cls, "plastic").lower()
    # Map YOLO class names to our categories
    mapping = {
        "bottle": "plastic", "can": "metal", "cardboard": "paper",
        "glass_bottle": "glass", "metal": "metal", "paper": "paper",
        "plastic": "plastic", "trash": "organic", "battery": "ewaste",
        "phone": "ewaste", "clothes": "textile", "food": "organic",
    }
    waste_type = mapping.get(label, "plastic")
    return {
        "type": waste_type, "confidence": conf,
        "description": f"{label.replace('_',' ').title()} detected",
        "recyclable": waste_type not in ["organic"],
        "instructions": "Sort into the appropriate bin.",
        "tip": "Clean items before recycling for better results."
    }

@app.post("/detect", response_model=DetectResponse)
async def detect_waste(req: DetectRequest):
    try:
        if yolo_model:
            result = detect_with_yolo(req.image_base64)
            method = "yolo11"
        else:
            result = await detect_with_claude(req.image_base64, req.mime_type)
            method = "claude_vision"

        meta = WASTE_META.get(result["type"], WASTE_META["plastic"])
        return DetectResponse(
            **result,
            points=meta["points"],
            co2_saved_kg=meta["co2_kg"],
            method=method,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {
        "status": "ok",
        "yolo_loaded": yolo_model is not None,
        "claude_fallback": bool(ANTHROPIC_KEY),
    }

@app.get("/categories")
def categories():
    return WASTE_META

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
