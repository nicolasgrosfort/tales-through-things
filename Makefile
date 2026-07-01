.PHONY: init-frontend dev-frontend init-backend dev-backend init dev

# Frontend
init-frontend: ; cd apps/frontend && yarn install
dev-frontend: ; cd apps/frontend && yarn dev

# Backend
init-backend: ; cd apps/backend && yarn install
dev-backend: ; cd apps/backend && yarn dev

# Common
init: init-frontend init-backend
dev: ; $(MAKE) -j2 dev-frontend dev-backend