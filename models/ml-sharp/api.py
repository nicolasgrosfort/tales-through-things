import subprocess
import uuid
import os
import shutil
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


BASE_DIR = Path(os.path.dirname(__file__))

SHARP_BIN = shutil.which("sharp") or str(BASE_DIR / ".venv" / "bin" / "sharp")
PYTHON_BIN = shutil.which("python") or str(BASE_DIR / ".venv" / "bin" / "python")

CONVERT_PY = str(BASE_DIR / "scripts/convert.py")
DECIMATE_PY = str(BASE_DIR / "scripts/decimate.py")
ROTATE_PY = str(BASE_DIR / "scripts/rotate.py")

OUTPUT_DIR = BASE_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

app = FastAPI(title="ML-Sharp Image to 3D API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/models", StaticFiles(directory=OUTPUT_DIR), name="models")


class ProcessRequest(BaseModel):
    imagePath: str
    ratio: float = 1.0
    rx: float = 0.0
    ry: float = 0.0
    rz: float = 0.0


@app.post("/process")
async def process(data: ProcessRequest, request: Request):
    job_id = uuid.uuid4().hex

    source_image_path = Path(data.imagePath)

    if not source_image_path.exists():
        raise HTTPException(400, f"Image not found: {source_image_path}")

    sharp_input = OUTPUT_DIR / f"{job_id}{source_image_path.suffix or '.png'}"
    raw_ply = OUTPUT_DIR / f"{job_id}.ply"
    tmp1 = OUTPUT_DIR / f"{job_id}_tmp1.ply"
    tmp2 = OUTPUT_DIR / f"{job_id}_tmp2.ply"
    final_ply = OUTPUT_DIR / f"{job_id}.final.ply"

    try:
        shutil.copyfile(source_image_path, sharp_input)

        r = subprocess.run(
            [
                SHARP_BIN,
                "predict",
                "-i",
                str(sharp_input),
                "-o",
                str(OUTPUT_DIR),
            ],
            capture_output=True,
            text=True,
        )

        if r.returncode != 0:
            raise HTTPException(500, f"SHARP error: {r.stderr}")

        if not raw_ply.exists():
            raise HTTPException(500, f"Expected SHARP output not found: {raw_ply}")

        r = subprocess.run(
            [PYTHON_BIN, CONVERT_PY, str(raw_ply), str(tmp1)],
            capture_output=True,
            text=True,
        )

        if r.returncode != 0:
            raise HTTPException(500, f"Convert error: {r.stderr}")

        r = subprocess.run(
            [
                PYTHON_BIN,
                DECIMATE_PY,
                str(tmp1),
                str(tmp2),
                "--ratio",
                str(data.ratio),
            ],
            capture_output=True,
            text=True,
        )

        if r.returncode != 0:
            raise HTTPException(500, f"Decimate error: {r.stderr}")

        r = subprocess.run(
            [
                PYTHON_BIN,
                ROTATE_PY,
                str(tmp2),
                "-o",
                str(final_ply),
                "-x",
                str(data.rx),
                "-y",
                str(data.ry),
                "-z",
                str(data.rz),
            ],
            capture_output=True,
            text=True,
        )

        if r.returncode != 0:
            raise HTTPException(500, f"Rotate error: {r.stderr}")

        model_url = str(request.base_url) + f"models/{final_ply.name}"

        return {
            "success": True,
            "jobId": job_id,
            "filename": final_ply.name,
            "modelUrl": model_url,
            "filePath": str(final_ply),
            "format": "ply",
            "ratio": data.ratio,
            "rotation": {
                "x": data.rx,
                "y": data.ry,
                "z": data.rz,
            },
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(500, str(e))

    finally:
        sharp_input.unlink(missing_ok=True)
        raw_ply.unlink(missing_ok=True)
        tmp1.unlink(missing_ok=True)
        tmp2.unlink(missing_ok=True)


@app.get("/health")
def health():
    return {"status": "ok"}