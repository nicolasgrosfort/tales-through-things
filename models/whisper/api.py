# whisper_api.py
import os
import tempfile
from contextlib import asynccontextmanager

import mlx_whisper
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# ── Config ─────────────────────────────────────────────────────────────────────

MODEL = os.getenv("WHISPER_MODEL", "mlx-community/whisper-large-v3-turbo")
LANGUAGE = os.getenv("WHISPER_LANG") or None          # None = auto-détect

# ── Lifespan (charge le modèle une seule fois au démarrage) ───────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"⏳ Chargement du modèle Whisper '{MODEL}'...")
    # mlx-whisper charge (et met en cache) le modèle au premier appel : on le force ici
    mlx_whisper.transcribe(np.zeros(16000, dtype=np.float32), path_or_hf_repo=MODEL)
    print("✔ Modèle prêt")
    yield

# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(title="Whisper STT API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # restreindre en prod
    allow_methods=["POST"],
    allow_headers=["*"],
)

# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL}


@app.post("/transcribe")
# async on purpose: runs on the event-loop thread, so Metal is never used from a worker thread
async def transcribe(file: UploadFile = File(...)):
    # Formats acceptés par Whisper
    content_type = (file.content_type or "").split(";")[0].strip()

    ALLOWED = {"audio/wav", "audio/mpeg", "audio/mp4", "audio/webm",
            "audio/ogg", "video/webm", "application/octet-stream",
            "audio/m4a", "audio/x-m4a"}

    if content_type not in ALLOWED:
        raise HTTPException(status_code=415, detail=f"Format non supporté : {file.content_type}")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Fichier vide")

    # Fichier temporaire (ffmpeg a besoin d'un path sur disque)
    suffix = os.path.splitext(file.filename or "audio")[1] or ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        result = mlx_whisper.transcribe(
            tmp_path,
            path_or_hf_repo=MODEL,
            language=LANGUAGE,
            # évite les boucles d'hallucination sur les silences
            condition_on_previous_text=False,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur transcription : {e}")
    finally:
        os.unlink(tmp_path)

    segments = result.get("segments", [])

    return {
        "text": result["text"].strip(),
        "language": result["language"],
        "duration": round(segments[-1]["end"], 2) if segments else 0.0,
    }
