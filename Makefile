NAME = transcendence
FRONTEND_DIR = ./frontend
BACKEND_DIR = ./backend

#################################################################################
#################################     MAIN      #################################

run: build start

start:
	docker-compose up -d

stop:
	docker-compose down

build: build-backend build-frontend

build-frontend:
	@mkdir -p frontend/src/shared
	@cp -rf shared/* frontend/src/shared/
	@docker-compose build frontend

build-backend:
	@mkdir -p backend/src/shared
	@cp -rf shared/* backend/src/shared/
	@docker-compose build backend

#################################################################################
#################################     LOGS      #################################

logs:
	docker-compose logs -f

logs-frontend:
	docker-compose logs frontend

logs-backend:
	docker-compose logs backend

#################################################################################
#################################     CLEAN     #################################

clean:
	docker-compose down --remove-orphans

fclean:
	docker-compose down --rmi all --volumes --remove-orphans

wipe-all:
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
        ps update update-deps
