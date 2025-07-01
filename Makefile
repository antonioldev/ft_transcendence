NAME = transcendence
FRONTEND_DIR = ./frontend
BACKEND_DIR = ./backend

#################################################################################
#################################     BUILD     #################################

build-frontend:
	docker build -t $(NAME)-frontend $(FRONTEND_DIR)

build-backend:
	docker build -t $(NAME)-backend $(BACKEND_DIR)

build: build-frontend build-backend

	
#################################################################################
#################################      RUN      #################################

run-frontend:
	docker run -d -p 8080:80 --name $(NAME)-frontend $(NAME)-frontend

run-backend:
	docker run -d -p 3000:3000 --name $(NAME)-backend $(NAME)-backend

run: run-frontend run-backend


#################################################################################
#################################     STOP      #################################

stop-frontend:
	docker stop $(NAME)-frontend

stop-backend:
	docker stop $(NAME)-backend

stop: stop-frontend stop-backend


#################################################################################
#################################     CLEAN     #################################

clean-frontend:
	-docker rm $(NAME)-frontend

clean-backend:
	-docker rm $(NAME)-backend

clean: clean-frontend clean-backend

rmi-frontend:
	-docker rmi $(NAME)-frontend

rmi-backend:
	-docker rmi $(NAME)-backend

fclean: stop clean rmi-frontend rmi-backend

force-clean:
	-docker stop $(NAME)-frontend $(NAME)-backend
	-docker rm $(NAME)-frontend $(NAME)-backend
	-docker rmi $(NAME)-frontend $(NAME)-backend


#################################################################################
#################################    REBUILD    #################################

re-frontend: stop-frontend clean-frontend build-frontend run-frontend
re-backend: stop-backend clean-backend build-backend run-backend
re: stop clean build run


#################################################################################
#################################    STATUS     #################################

ps:
	docker ps

logs-frontend:
	docker logs $(NAME)-frontend

logs-backend:
	docker logs $(NAME)-backend

logs: logs-frontend logs-backend

.PHONY: build build-frontend build-backend run run-frontend run-backend up \
        stop stop-frontend stop-backend clean clean-frontend clean-backend \
        rmi-frontend rmi-backend fclean re re-frontend re-backend ps \
        logs logs-frontend logs-backend force-clean