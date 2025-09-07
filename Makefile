NAME = transcendence
FRONTEND_DIR = ./frontend
BACKEND_DIR = ./backend
VOLUME = ./backend/src/database/transcendence.sqlite
BACKEND_DNS = transcendance-backend
SITE_HOSTS = localhost,127.0.0.1

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

certs:
	@echo "Generating internal CA + certs (BACKEND_DNS=$${BACKEND_DNS}, SITE_HOSTS=$${SITE_HOSTS})"
	@BACKEND_DNS=$${BACKEND_DNS} SITE_HOSTS=$${SITE_HOSTS} bash make_certs.sh

#################################################################################
#################################     MAIN      #################################

run: certs build start

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
		pepper-env \
		certs
