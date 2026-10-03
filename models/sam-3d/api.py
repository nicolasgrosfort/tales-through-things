import io
import os
import urllib.parse
import urllib.request
import uuid
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image
from pydantic import BaseModel, Field
from mlx_spatial.sam3d_inference import Sam3dInferencePipeline


BASE_DIR = Path(__file__).parent.resolve()

# mlx-spatial only writes under ./outputs (relative to the cwd)
os.chdir(BASE_DIR)
OUTPUT_DIR = BASE_DIR / "outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def find_model_root() -> Path:
    if env_root := os.getenv("SAM3D_MODEL"):
        return Path(env_root)

    hf_home = Path(os.getenv("HF_HOME", Path.home() / ".cache" / "huggingface"))
    snapshots = sorted(
        (hf_home / "hub" / "models--appautomaton--sam-3d-objects-mlx" / "snapshots").glob("*"),
        key=lambda p: p.stat().st_mtime,
    )
    if not snapshots:
        raise RuntimeError(
            "sam-3d-objects-mlx not found. Run: hf download appautomaton/sam-3d-objects-mlx"
        )
    return snapshots[-1]


MODEL_ROOT = find_model_root()

app = FastAPI(title="SAM 3D Objects API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/models", StaticFiles(directory=OUTPUT_DIR), name="models")

pipeline = Sam3dInferencePipeline(MODEL_ROOT)


def reconstruct(
    request: Request,
    image_path: Path,
    mask_path: Path,
    job_id: str,
    glb: bool,
    seed: int,
    stage1_steps: int,
    stage2_steps: int,
    memory_profile: str,
    glb_texture_size: int,
):
    ply_path = OUTPUT_DIR / f"{job_id}.ply"
    glb_path = OUTPUT_DIR / f"{job_id}.glb" if glb else None

    try:
        result = pipeline.generate_gaussians_ply(
            image_path,
            mask_path=mask_path,
            output_path=ply_path,
            glb_output_path=glb_path,
            moge_root=MODEL_ROOT / "moge",
            seed=seed,
            stage1_steps=stage1_steps,
            stage2_steps=stage2_steps,
            memory_profile=memory_profile,
            glb_texture_size=glb_texture_size,
        )
    except ValueError as error:
        raise HTTPException(400, str(error))

    blocker = result.trace.blocker
    if blocker is not None:
        raise HTTPException(500, f"SAM3D blocked at {blocker.stage}: {blocker.reason}")

    base_url = str(request.base_url) + "models/"

    return {
        "success": True,
        "id": job_id,
        "ply_url": base_url + ply_path.name,
        "glb_url": base_url + glb_path.name if glb_path and glb_path.exists() else None,
        "file_path": str(ply_path),
        "completed_stages": list(result.trace.completed_stages),
    }


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


class GenerateRequest(BaseModel):
    imagePath: str | None = Field(default=None, description="Path of a PNG with a transparent background")
    imageUrl: str | None = Field(default=None, description="Alternative to imagePath: http(s):// or file:// url")
    glb: bool = False
    seed: int = 42
    stage1Steps: int = Field(default=10, ge=1, le=100)
    stage2Steps: int = Field(default=10, ge=1, le=100)
    memoryProfile: Literal["safe", "balanced", "large"] = "balanced"
    glbTextureSize: int = Field(default=1024, ge=128, le=4096)


@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "SAM 3D Objects API is running",
        "model": str(MODEL_ROOT),
    }


@app.post("/generate")
# async on purpose: runs on the event-loop thread, so Metal is never used from a worker thread
async def generate(request: Request, data: GenerateRequest):
    source = data.imagePath or data.imageUrl
    if not source:
        raise HTTPException(422, "Provide imagePath (or imageUrl)")

    upload = fetch_image(source)

    job_id = uuid.uuid4().hex
    image_path = OUTPUT_DIR / f"{job_id}_input.png"
    mask_path = OUTPUT_DIR / f"{job_id}_mask.png"

    rgba = upload.convert("RGBA")
    alpha = rgba.getchannel("A")
    if alpha.getextrema()[0] == 255:
        raise HTTPException(
            400, "Image has no transparent pixels: upload a PNG with a transparent background"
        )

    # object = every pixel that is not fully transparent
    alpha.point(lambda a: 255 if a > 0 else 0).save(mask_path)
    rgba.convert("RGB").save(image_path)

    return reconstruct(
        request, image_path, mask_path, job_id,
        data.glb, data.seed, data.stage1Steps, data.stage2Steps,
        data.memoryProfile, data.glbTextureSize,
    )
