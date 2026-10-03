import os
import random
import uuid
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from mflux.models.common.config.model_config import ModelConfig
from mflux.models.flux.variants.txt2img.flux import Flux1
from pydantic import BaseModel, Field


# pre-quantized (4-bit) mirror: black-forest-labs/FLUX.1-schnell is gated on Hugging Face
MODEL_PATH = os.getenv("FLUX_MODEL", "madroid/flux.1-schnell-mflux-4bit")

BASE_DIR = Path(__file__).parent
OUTPUT_DIR = BASE_DIR / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Flux Image Generator API")

app.mount("/images", StaticFiles(directory=OUTPUT_DIR), name="images")


model = Flux1(model_config=ModelConfig.schnell(), model_path=MODEL_PATH)


class GenerateRequest(BaseModel):
    prompt: str
    width: int = Field(default=1024, ge=256, le=2048)
    height: int = Field(default=1024, ge=256, le=2048)
    steps: int = Field(default=4, ge=1, le=50)
    seed: int | None = None


@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "Flux Image Generator API is running",
        "model": MODEL_PATH,
    }


@app.post("/generate")
# async on purpose: runs on the event-loop thread, so Metal is never used from a worker thread
async def generate_image(request_data: GenerateRequest, request: Request):
    seed = request_data.seed if request_data.seed is not None else random.randint(0, 2**32 - 1)

    result = model.generate_image(
        seed=seed,
        prompt=request_data.prompt,
        num_inference_steps=request_data.steps,
        width=request_data.width,
        height=request_data.height,
    )

    filename = f"{uuid.uuid4().hex}.png"
    filepath = OUTPUT_DIR / filename

    result.image.save(filepath)

    image_url = str(request.base_url) + f"images/{filename}"

    return {
        "success": True,
        "filename": filename,
        "image_url": image_url,
        "file_path": str(filepath),
        "width": request_data.width,
        "height": request_data.height,
        "seed": seed,
    }
