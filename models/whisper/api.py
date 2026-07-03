# whisper_api.py
import os
import tempfile
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel

# ── Config ─────────────────────────────────────────────────────────────────────

MODEL_SIZE = os.getenv("WHISPER_MODEL", "medium")
DEVICE     = os.getenv("WHISPER_DEVICE", "cpu")       # "cuda" si GPU
LANGUAGE   = os.getenv("WHISPER_LANG", 'fr')          # None = auto-détect

# ── Lifespan (charge le modèle une seule fois au démarrage) ───────────────────

model: WhisperModel | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    print(f"⏳ Chargement du modèle Whisper '{MODEL_SIZE}' sur {DEVICE}...")
    COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE", "int8") 
    model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
    print("✔ Modèle prêt")
    yield
    model = None

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
    return {"status": "ok", "model": MODEL_SIZE, "device": DEVICE}


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=503, detail="Modèle non chargé")

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

    # Fichier temporaire (Whisper a besoin d'un path sur disque)
    suffix = os.path.splitext(file.filename or "audio")[1] or ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        segments, info = model.transcribe(
            tmp_path,
            language=LANGUAGE,
            beam_size=5,
            vad_filter=True,          # filtre les silences
            vad_parameters={"min_silence_duration_ms": 500},
        )
        text = " ".join(s.text.strip() for s in segments)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur transcription : {e}")
    finally:
        os.unlink(tmp_path)

    return {
        "text": text,
        "language": info.language,
        "language_probability": round(info.language_probability, 2),
        "duration": round(info.duration, 2),
    }