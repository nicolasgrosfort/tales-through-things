.PHONY: init-frontend dev-frontend init-backend dev-backend init dev dev-agent init-agent chat-agent log-agent

# Agent
init-agent: ; cp .env.example .env && docker compose up -d hermes && docker exec -it hermes hermes setup
chat-agent: ; docker exec -it hermes hermes --tui
dev-agent: ; docker compose up -d hermes
log-agent: ; docker compose logs -f hermes
config-agent: ; docker exec hermes hermes config
setup-agent: ; docker exec hermes hermes setup
status-agent: ; docker exec hermes hermes status
sessions-agent: ; docker exec hermes hermes sessions list

# Backend
init-backend: ; cd apps/backend && yarn install
dev-backend: ; cd apps/backend && yarn dev

# Common
init: init-frontend init-backend init-agent
dev: ; $(MAKE) -j2 dev-frontend dev-backend dev-agent

# Frontend
init-frontend: ; cd apps/frontend && yarn install
dev-frontend: ; cd apps/frontend && yarn dev