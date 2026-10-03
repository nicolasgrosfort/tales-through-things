import io
import os
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

import torch
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image
from pydantic import BaseModel
from torchvision import transforms
from transformers import AutoModelForImageSegmentation


# mlx-community/BiRefNet-fp16 is an MLX (Swift only) conversion of this checkpoint
MODEL_ID = os.getenv("BIREFNET_MODEL", "ZhengPeng7/BiRefNet")
INPUT_SIZE = 1024

BASE_DIR = Path(__file__).parent
OUTPUT_DIR = BASE_DIR / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="BiRefNet Background Removal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/images", StaticFiles(directory=OUTPUT_DIR), name="images")

device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"
dtype = torch.float16 if device != "cpu" else torch.float32

model = AutoModelForImageSegmentation.from_pretrained(MODEL_ID, trust_remote_code=True)
model.to(device=device, dtype=dtype).eval()

preprocess = transforms.Compose(
    [
        transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ]
)


class RemoveBackgroundRequest(BaseModel):
    imagePath: str | None = None
    imageUrl: str | None = None


def fetch_image(source: str) -> Image.Image:
    # accepts http(s):// and file:// urls as well as plain local paths
    source = source.strip()
    try:
        if source.startswith(("http://", "https://")):
            with urllib.request.urlopen(source, timeout=30) as response:
                data = response.read()
        else:
            path = urllib.parse.unquote(urllib.parse.urlparse(source).path) if source.startswith("file://") else source
            data = Path(path).expanduser().read_bytes()
        image = Image.open(io.BytesIO(data))
        image.load()
        return image
    except Exception:
        raise HTTPException(400, f"Could not load an image from {source}")


@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "BiRefNet Background Removal API is running",
        "model": MODEL_ID,
        "device": device,
    }


@app.post("/remove-background")
# async on purpose: runs on the event-loop thread, so Metal is never used from a worker thread
async def remove_background(request: Request, data: RemoveBackgroundRequest):
    source = data.imagePath or data.imageUrl
    if not source:
        raise HTTPException(422, "Provide imagePath (or imageUrl)")

    image = fetch_image(source).convert("RGB")

    batch = preprocess(image).unsqueeze(0).to(device=device, dtype=dtype)

    with torch.no_grad():
        # last output holds the final matte logits
        matte = model(batch)[-1].sigmoid().float().cpu()[0].squeeze()

    mask = transforms.ToPILImage()(matte).resize(image.size, Image.Resampling.LANCZOS)

    result = image.copy()
    result.putalpha(mask)

    filename = f"{uuid.uuid4().hex}.png"
    filepath = OUTPUT_DIR / filename
    result.save(filepath)

    return {
        "success": True,
        "filename": filename,
        "image_url": str(request.base_url) + f"images/{filename}",
        "file_path": str(filepath),
        "width": image.width,
        "height": image.height,
    }
