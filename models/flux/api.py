import os
import uuid
from pathlib import Path
from typing import Any, cast

import torch
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from diffusers.pipelines.flux2.pipeline_flux2_klein import Flux2KleinPipeline


MODEL_ID = os.getenv("FLUX_MODEL", "black-forest-labs/FLUX.2-klein-4B")

BASE_DIR = Path(__file__).parent
OUTPUT_DIR = BASE_DIR / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Flux Image Generator API")

app.mount("/images", StaticFiles(directory=OUTPUT_DIR), name="images")


pipe = Flux2KleinPipeline.from_pretrained(
    MODEL_ID,
    torch_dtype=torch.bfloat16,
)

pipe.enable_model_cpu_offload()


class GenerateRequest(BaseModel):
    prompt: str
    width: int = Field(default=1024, ge=256, le=2048)
    height: int = Field(default=1024, ge=256, le=2048)
    steps: int = Field(default=4, ge=1, le=50)
    guidance_scale: float = Field(default=1.0, ge=0.0, le=20.0)


@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "Flux Image Generator API is running",
    }


@app.post("/generate")
def generate_image(request_data: GenerateRequest, request: Request):
    result = cast(
        Any,
        pipe(
            prompt=request_data.prompt,
            width=request_data.width,
            height=request_data.height,
            num_inference_steps=request_data.steps,
            guidance_scale=request_data.guidance_scale,
            return_dict=True,
        ),
    )

    image = result.images[0]

    filename = f"{uuid.uuid4().hex}.png"
    filepath = OUTPUT_DIR / filename

    image.save(filepath)

    image_url = str(request.base_url) + f"images/{filename}"

    return {
        "success": True,
        "filename": filename,
        "image_url": image_url,
        "file_path": str(filepath),
        "width": request_data.width,
        "height": request_data.height,
    }