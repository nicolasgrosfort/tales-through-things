include .env
export

.PHONY: init-frontend dev-frontend init-backend dev-backend init dev dev-agent init-agent chat-agent log-agent

# - - - - - - - - - -

# Hermes
init-agent: ; cp .env.example .env && docker compose up -d hermes && docker exec -it hermes hermes setup
chat-agent: ; docker exec -it hermes hermes --tui
dev-agent: ; docker compose up -d hermes
log-agent: ; docker compose logs -f hermes
config-agent: ; docker exec hermes hermes config
setup-agent: ; docker exec hermes hermes setup
status-agent: ; docker exec hermes hermes status
sessions-agent: ; docker exec hermes hermes sessions list

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

# - - - - - - - - - -

# Common
init: init-frontend init-backend init-agent init-whisper
dev: ; $(MAKE) -j4 dev-frontend dev-backend dev-agent dev-whisper