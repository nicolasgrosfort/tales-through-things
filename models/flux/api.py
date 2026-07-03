import os
import uuid
from pathlib import Path
from typing import Any, cast

import torch
from fastapi import FastAPI
from pydantic import BaseModel
from diffusers.pipelines.flux2.pipeline_flux2_klein import Flux2KleinPipeline

MODEL_ID = os.getenv("FLUX_MODEL", "black-forest-labs/FLUX.2-klein-4B")

BASE_DIR = Path(__file__).parent
OUTPUT_DIR = BASE_DIR / "outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI()

pipe = Flux2KleinPipeline.from_pretrained(
    MODEL_ID,
    torch_dtype=torch.bfloat16,
)

pipe.enable_model_cpu_offload()


class GenerateRequest(BaseModel):
    prompt: str
    width: int = 1024
    height: int = 1024
    steps: int = 4
    guidance_scale: float = 1.0


@app.post("/generate")
def generate_image(request: GenerateRequest):
    result = cast(Any, pipe(
        prompt=request.prompt,
        width=request.width,
        height=request.height,
        num_inference_steps=request.steps,
        guidance_scale=request.guidance_scale,
        return_dict=True,
    ))

    image = result.images[0]

    filename = f"{uuid.uuid4().hex}.png"
    filepath = OUTPUT_DIR / filename

    image.save(filepath)

    return {
        "success": True,
        "filename": filename,
        "path": str(filepath),
    }