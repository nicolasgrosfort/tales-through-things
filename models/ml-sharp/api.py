import subprocess
import uuid
import os
import shutil
from pathlib import Path

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = Path(os.path.dirname(__file__))

SHARP_BIN = shutil.which("sharp") or str(BASE_DIR / ".venv" / "bin" / "sharp")
PYTHON_BIN = shutil.which("python") or str(BASE_DIR / ".venv" / "bin" / "python")
CONVERT_PY = str(BASE_DIR / "scripts/convert.py")
DECIMATE_PY = str(BASE_DIR / "scripts/decimate.py")
ROTATE_PY = str(BASE_DIR / "scripts/rotate.py")

INPUT_DIR = BASE_DIR / "input"
OUTPUT_DIR = BASE_DIR / "output"

INPUT_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/process")
async def process(
    file: UploadFile = File(...),
    ratio: float = Form(1.0),
    rx: float = Form(0.0),
    ry: float = Form(0.0),
    rz: float = Form(0.0),
):
    job_id = uuid.uuid4().hex
    input_path = INPUT_DIR / f"{job_id}.jpg"
    raw_ply = OUTPUT_DIR / f"{job_id}.ply"
    tmp1    = OUTPUT_DIR / f"{job_id}_tmp1.ply"
    tmp2    = OUTPUT_DIR / f"{job_id}_tmp2.ply"
    tmp3    = OUTPUT_DIR / f"{job_id}_tmp3.ply"

    try:
        input_path.write_bytes(await file.read())

        r = subprocess.run(
            [SHARP_BIN, "predict", "-i", str(input_path), "-o", str(OUTPUT_DIR)],
            capture_output=True, text=True,
        )
        if r.returncode != 0:
            raise HTTPException(500, f"SHARP error: {r.stderr}")

        r = subprocess.run(
            [PYTHON_BIN, CONVERT_PY, str(raw_ply), str(tmp1)],
            capture_output=True, text=True,
        )
        if r.returncode != 0:
            raise HTTPException(500, f"Convert error: {r.stderr}")

        r = subprocess.run(
            [PYTHON_BIN, DECIMATE_PY, str(tmp1), str(tmp2), "--ratio", str(ratio)],
            capture_output=True, text=True,
        )
        if r.returncode != 0:
            raise HTTPException(500, f"Decimate error: {r.stderr}")

        r = subprocess.run(
            [PYTHON_BIN, ROTATE_PY, str(tmp2), "-o", str(tmp3),
             "-x", str(rx), "-y", str(ry), "-z", str(rz)],
            capture_output=True, text=True,
        )
        if r.returncode != 0:
            raise HTTPException(500, f"Rotate error: {r.stderr}")

        return FileResponse(
            path=tmp3,
            media_type="application/octet-stream",
            filename="output.ply",
            background=None,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))
    finally:
        input_path.unlink(missing_ok=True)
        raw_ply.unlink(missing_ok=True)
        tmp1.unlink(missing_ok=True)
        tmp2.unlink(missing_ok=True)

@app.get("/health")
def health():
    return {"status": "ok"}