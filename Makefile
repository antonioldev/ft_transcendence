NAME = transcendence
FRONTEND_DIR = ./frontend
BACKEND_DIR = ./backend
VOLUME = ./backend/src/database/transcendence.sqlite

#################################################################################
############################## PEPPER GENERATION ################################

PEPPER_GEN = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
COOKIE_GEN = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
pepper-env:
	@if ! grep -q '^PEPPER=' .env; then \
		PEPPER_VALUE=$$($(PEPPER_GEN)); \
		echo "PEPPER not found. Generating one..."; \
		echo -n "\nPEPPER=\"$${PEPPER_VALUE}\"" >> .env; \
	else \
		echo "PEPPER already set in .env"; \
	fi

cookie-env:
	@if ! grep -q '^COOKIE_SECRET=' .env; then \
		COOKIE_VALUE=$$($(COOKIE_GEN)); \
		echo "COOKIE not found. Generating one..."; \
		echo -n "\nCOOKIE_SECRET=\"$${COOKIE_VALUE}\"" >> .env; \
	else \
		echo "COOKIE already set in .env"; \
	fi

secret-env: pepper-env cookie-env

#################################################################################
#################################     MAIN      #################################

run: set-env-ip build start
	@. ./.env; echo "Server running at https://$${LAN_IP}:8443"

start:
	docker-compose up -d

stop:
	docker-compose down

build: secret-env build-backend build-frontend

build-frontend:
	@mkdir -p frontend/src/shared
	@cp -rf shared/* frontend/src/shared/
	@chmod -R a-w frontend/src/shared
	@docker-compose build frontend

build-backend:
	@mkdir -p backend/src/shared
	@cp -rf shared/* backend/src/shared/
	@chmod -R a-w backend/src/shared
	@docker-compose build backend

set-env-ip:
	@touch .env
	@IP=$$(hostname -I 2>/dev/null | awk '{print $$1}') || \
	 IP=$$(ip addr show eth0 2>/dev/null | grep "inet " | awk '{print $$2}' | cut -d/ -f1) || \
	 IP=127.0.0.1; \
	\
	tmp=$$(mktemp 2>/dev/null || echo .env.tmp); \
	grep -vE '^(LAN_IP)=' .env > "$$tmp" 2>/dev/null || true; \
	mv "$$tmp" .env; \
	printf "LAN_IP=%s\n" "$$IP" >> .env; \
	echo "✅ LAN_IP set to $$IP and written to .env"

#################################################################################
#################################     DEV      ##################################

# DEVELOPMENT: Start only backend and run frontend in dev mode
dev: secret-env build-backend start-backend dev-frontend

# Start only backend (without frontend)
start-backend:
	@mkdir -p backend/src/shared
	@cp -rf shared/* backend/src/shared/
	@chmod -R a-w backend/src/shared
	docker-compose up -d backend nginx

# Run frontend in development mode with hot reload
dev-frontend:
	@mkdir -p frontend/src/shared
	@cp -rf shared/* frontend/src/shared/
	@echo "🚀 Starting frontend in development mode..."
	@echo "💡 Frontend will be served at: https://localhost:8443"
	@echo "🔄 Hot reload enabled - changes will appear automatically"
	cd frontend && npm run dev

#################################################################################
#################################     LOGS      #################################

logs:
	docker-compose logs -f

logs-frontend:
	docker-compose logs frontend

logs-backend:
	docker-compose logs backend

logs-nginx:
	docker-compose logs nginx

#################################################################################
#################################     CLEAN     #################################

clean:
	docker-compose down --remove-orphans

fclean:
	docker-compose down --rmi all --volumes --remove-orphans
	@chmod -R u+w frontend/src/shared || true
	@rm -rf frontend/src/shared || true
	@chmod -R u+w backend/src/shared || true
	@rm -rf backend/src/shared || true
	@rm -rf backend/src/database/transcendence.sqlite
	

clean-db:
	@rm -f backend/src/database/transcendence.sqlite

wipe-all:
	@rm -f $(VOLUME)
	docker system prune -a

wipe-images:
	docker image prune -a

#################################################################################
#################################    REBUILD    #################################

re:
	docker-compose down
	docker-compose up --build

restart:
	docker-compose restart

#################################################################################
#################################    STATUS     #################################

ps:
	docker-compose ps

backend-sh:
	docker exec -it transcendence-backend /bin/sh

frontend-sh:
	docker exec -it transcendence-frontend /bin/sh

nginx-sh:
	docker exec -it transcendence-nginx /bin/sh

#################################################################################
#################################    UPDATES    #################################

update-deps:
	cd $(BACKEND_DIR) && npx npm-check-updates -u && npm install
	cd $(FRONTEND_DIR) && npx npm-check-updates -u && npm install

update: update-deps fclean up-build

.PHONY: run start stop \
        build build-frontend build-backend \
        logs logs-frontend logs-backend \
        clean fclean re restart \
        ps update update-deps \
		pepper-env set-env-ip print-url
