include .env
export

.PHONY: init-frontend dev-frontend init-backend dev-backend init dev dev-agent init-agent chat-agent log-agent

# - - - - - - - - - -

# Hermes
init-agent: ; cp .env.example .env && docker compose up -d hermes && docker exec -it hermes hermes setup && cd hermes/mcp/memorize && npm install
sh-agent: ; docker exec -it hermes sh
chat-agent: ; docker exec -it hermes hermes --tui
dev-agent: ; docker compose up -d hermes
log-agent: ; docker compose logs -f hermes
config-agent: ; docker exec hermes hermes config
setup-agent: ; docker exec hermes hermes setup
status-agent: ; docker exec hermes hermes status
sessions-agent: ; docker exec hermes hermes sessions list
restart-agent: ; docker compose restart hermes
update-agent: ; docker compose pull hermes && docker compose up -d hermes

# - - - - - - - - - -

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
	conda run -n whisper pip install faster-whisper fastapi "uvicorn[standard]" python-multipart
dev-whisper:
	conda run -n whisper uvicorn models.whisper.api:app \
		--host 0.0.0.0 \
		--port $(WHISPER_PORT) \
		--reload --reload

## Flux
init-flux:
	conda create -n flux python=3.11 -y
	conda run -n flux pip install git+https://github.com/huggingface/diffusers.git \
		transformers accelerate safetensors fastapi "uvicorn[standard]" \
		python-multipart torch torchvision pillow
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

## Headroom
init-headroom:
	conda create -n headroom python=3.11 -y
	conda run -n headroom pip install "headroom-ai[proxy]"
dev-headroom:
	conda run -n headroom headroom proxy --port $(HEADROOM_PORT)

# - - - - - - - - - -

# Common
init: init-frontend init-backend init-agent init-whisper init-flux init-sharp init-headroom
dev: ; $(MAKE) -j7 dev-frontend dev-backend dev-agent dev-whisper dev-flux dev-sharp dev-headroom