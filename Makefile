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

run: build start

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

#################################################################################
#################################     DEV      ##################################

# DEVELOPMENT: Start complete development environment in Docker
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

update: update-deps fclean build start

.PHONY: run start stop \
        build build-frontend build-backend build-backend-only \
        dev start-backend dev-frontend dev-stop \
        logs logs-frontend logs-backend \
        clean fclean clean-db wipe-all wipe-images re restart \
        ps update update-deps \
		pepper-env
