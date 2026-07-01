.PHONY: init-frontend dev-frontend init-backend dev-backend dev-all

# Frontend

init-frontend: 
	cd apps/frontend && yarn install

dev-frontend:
	cd apps/frontend && yarn dev

# Backend

init-backend:
	cd apps/backend && yarn install

dev-backend:
	cd apps/backend && yarn dev 

# Common

dev-all:
	$(MAKE) -j2 dev-frontend dev-backend