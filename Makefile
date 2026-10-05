include .env
export

.PHONY: init-frontend dev-frontend init-backend dev-backend init dev

# Apps

## Backend
init-backend: ; cd apps/backend && yarn install
dev-backend: ; cd apps/backend && yarn dev

## Frontend
init-frontend: ; cd apps/frontend && yarn install
dev-frontend: ; cd apps/frontend && yarn dev

# - - - - - - - - - -

# Models

## Whisper
init-whisper:
	conda create -n whisper python=3.11 -y
	conda run -n whisper pip install mlx-whisper fastapi "uvicorn[standard]" python-multipart
dev-whisper:
	conda run --no-capture-output -n whisper uvicorn models.whisper.api:app \
		--host 0.0.0.0 \
		--port $(WHISPER_PORT) \
		--reload

## Flux
init-flux:
	conda create -n flux python=3.11 -y
	conda run -n flux pip install mflux fastapi "uvicorn[standard]" python-multipart pillow
dev-flux:
	conda run -n flux uvicorn models.flux.api:app \
		--host 0.0.0.0 \
		--port $(FLUX_PORT)

#ML-Sharp
init-sharp:
	cd models/ml-sharp && git clone https://github.com/apple/ml-sharp sharp || true
	conda create -n sharp python=3.13 -y
	cd models/ml-sharp/sharp && conda run -n sharp pip install -r requirements.txt
	conda run -n sharp pip install fastapi "uvicorn[standard]" python-multipart
dev-sharp:
	conda run -n sharp uvicorn models.ml-sharp.api:app \
		--host 0.0.0.0 \
		--port ${SHARP_PORT} \
		--reload

## SAM 3D
init-sam3d:
	conda create -n sam3d python=3.11 -y
	conda run -n sam3d pip install mlx-spatial fastapi "uvicorn[standard]" python-multipart pillow
dev-sam3d:
	conda run -n sam3d uvicorn models.sam-3d.api:app \
		--host 0.0.0.0 \
		--port $(SAM3D_PORT)

## BiRefNet
init-birefnet:
	conda create -n birefnet python=3.11 -y
	conda run -n birefnet pip install torch torchvision transformers timm einops kornia \
		fastapi "uvicorn[standard]" python-multipart pillow
dev-birefnet:
	conda run -n birefnet uvicorn models.birefnet.api:app \
		--host 0.0.0.0 \
		--port $(BIREFNET_PORT)

## Headroom
init-headroom:
	conda create -n headroom python=3.11 -y
	conda run -n headroom pip install "headroom-ai[proxy]"
dev-headroom:
	conda run -n headroom headroom proxy --port $(HEADROOM_PORT)

# - - - - - - - - - -

# Common
init: init-frontend init-backend init-whisper init-flux init-sharp init-sam3d init-birefnet init-headroom
dev: ; $(MAKE) -j9 dev-frontend dev-backend dev-whisper dev-flux dev-sharp dev-sam3d dev-birefnet dev-headroom