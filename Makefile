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
	@chmod -R u+w frontend/src/shared || true
	@rm -rf frontend/src/shared || true
	@mkdir -p frontend/src/shared
	@cp -rf shared/* frontend/src/shared/
	@chmod -R a-w frontend/src/shared
	@docker-compose build frontend

build-backend:
	@chmod -R u+w backend/src/shared || true
	@rm -rf backend/src/shared || true
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

home:
	@echo "Cleaning up previous containers and images..."
	docker compose down --rmi all --volumes --remove-orphans
	@echo "Cleaning shared directories..."
	@if exist frontend\src\shared rmdir /s /q frontend\src\shared
	@if exist backend\src\shared rmdir /s /q backend\src\shared
	@if exist backend\src\database\transcendence.sqlite del /q backend\src\database\transcendence.sqlite
	@echo "Copying shared files..."
	@mkdir frontend\src\shared 2>nul || true
	@xcopy /s /e /y shared\* frontend\src\shared\ >nul
	@mkdir backend\src\shared 2>nul || true
	@xcopy /s /e /y shared\* backend\src\shared\ >nul
	@echo "Building and starting containers..."
	docker compose up -d --build
	@echo "Server is starting up..."
	@echo "Reading IP from .env file..."
	@for /f "tokens=2 delims==" %%i in ('findstr "LAN_IP" .env') do set LAN_IP=%%i
	@echo Server running at https://192.168.0.17:8443
	@echo "Run 'make logs' to see the logs once containers are up"

#################################################################################
#################################     DEV      ##################################

dev: secret-env build-backend-only
	docker-compose -f docker-compose.dev.yml up -d --build

# Build only backend for development
build-backend-only:
	@chmod -R u+w backend/src/shared || true
	@rm -rf backend/src/shared || true
	@mkdir -p backend/src/shared
	@cp -rf shared/* backend/src/shared/
	@chmod -R a-w backend/src/shared
	@docker-compose -f docker-compose.dev.yml build backend

# Start only backend (without frontend)
start-backend:
	docker-compose -f docker-compose.dev.yml up -d backend

# Run frontend in development mode with hot reload
dev-frontend:
	docker-compose -f docker-compose.dev.yml up -d --build frontend-dev

# Stop development environment
dev-stop:
	docker-compose -f docker-compose.dev.yml down

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
	docker-compose -f docker-compose.dev.yml down --rmi all --volumes --remove-orphans
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
	docker-compose up -d --build

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

update: update-deps fclean build start

.PHONY: run start stop \
        build build-frontend build-backend build-backend-only \
        dev start-backend dev-frontend dev-stop \
        logs logs-frontend logs-backend \
        clean fclean clean-db wipe-all wipe-images re restart \
        ps update update-deps \
		pepper-env set-env-ip print-url home
