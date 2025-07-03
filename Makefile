NAME = transcendence
FRONTEND_DIR = ./frontend
BACKEND_DIR = ./backend

#################################################################################
#################################     MAIN      #################################

up:
	docker-compose up -d

up-build:
	docker-compose up --build -d

down:
	docker-compose down

build:
	docker-compose build

build-frontend:
	docker-compose build frontend

build-backend:
	docker-compose build backend

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

shell-backend:
	docker-compose exec backend sh

shell-frontend:
	docker-compose exec frontend sh

#################################################################################
#################################    UPDATES    #################################

update-deps:
	cd $(BACKEND_DIR) && npx npm-check-updates -u && npm install
	cd $(FRONTEND_DIR) && npx npm-check-updates -u && npm install

update: update-deps fclean up-build

#################################################################################
#################################   ALIASES     #################################

# Aliases for convenience
start: up
stop: down
rebuild: re
run: up

.PHONY: up up-build down build build-frontend build-backend logs logs-frontend \
        logs-backend clean fclean re restart ps shell-backend shell-frontend \
        update update-deps start stop rebuild run

# NAME = transcendence
# FRONTEND_DIR = ./frontend
# BACKEND_DIR = ./backend

# ################################################################################
# #################################   DEVELOPMENT  ###############################

# dev-up:
# 	docker-compose -f docker-compose.yml up -d

# dev-down:
# 	docker-compose -f docker-compose.yml down

# dev-logs:
# 	docker-compose -f docker-compose.yml logs -f

# dev-fclean:
# 	docker-compose -f docker-compose.yml down --rmi all

# dev-restart:
# 	docker-compose -f docker-compose.yml restart

# #################################################################################
# #################################     BUILD     #################################

# build-frontend:
# 	docker build -t $(NAME)-frontend $(FRONTEND_DIR)

# build-backend:
# 	docker build -t $(NAME)-backend $(BACKEND_DIR)

# build: build-frontend build-backend

	
# #################################################################################
# #################################      RUN      #################################

# run-frontend:
# 	docker run -d -p 8080:80 --name $(NAME)-frontend $(NAME)-frontend

# run-backend:
# 	docker run -d -p 3000:3000 --name $(NAME)-backend $(NAME)-backend

# run: run-frontend run-backend


# #################################################################################
# #################################     STOP      #################################

# stop-frontend:
# 	-docker stop $(NAME)-frontend

# stop-backend:
# 	-docker stop $(NAME)-backend

# stop: stop-frontend stop-backend


# #################################################################################
# #################################     CLEAN     #################################

# clean-frontend:
# 	-docker rm $(NAME)-frontend

# clean-backend:
# 	-docker rm $(NAME)-backend

# clean: clean-frontend clean-backend

# rmi-frontend:
# 	-docker rmi $(NAME)-frontend

# rmi-backend:
# 	-docker rmi $(NAME)-backend

# clean-previous:
# 	docker image prune -f

# fclean: stop clean rmi-frontend rmi-backend clean-previous

# force-clean:
# 	-docker stop $(NAME)-frontend $(NAME)-backend
# 	-docker rm $(NAME)-frontend $(NAME)-backend
# 	-docker rmi $(NAME)-frontend $(NAME)-backend

# #################################################################################
# #################################    REBUILD    #################################

# re-frontend: stop-frontend clean-frontend build-frontend run-frontend
# re-backend: stop-backend clean-backend build-backend run-backend
# re: stop clean build run


# #################################################################################
# #################################    UPDATES    #################################

# update-deps:
# 	cd $(BACKEND_DIR) && npx npm-check-updates -u && npm install
# 	cd $(FRONTEND_DIR) && npx npm-check-updates -u && npm install

# update: update-deps fclean build up


# #################################################################################
# #################################    STATUS     #################################

# ps:
# 	docker ps

# logs-frontend:
# 	docker logs $(NAME)-frontend

# logs-backend:
# 	docker logs $(NAME)-backend

# logs: logs-frontend logs-backend

# .PHONY: build build-frontend build-backend run run-frontend run-backend up \
#         stop stop-frontend stop-backend clean clean-frontend clean-backend \
#         rmi-frontend rmi-backend fclean re re-frontend re-backend ps \
#         logs logs-frontend logs-backend force-clean

