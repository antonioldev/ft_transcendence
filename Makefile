NAME = transcendence
PORT = 8080
FRONTEND_DIR = ./frontend
BACKEND_DIR = ./backend

build:
	docker build -t $(NAME)-frontend $(FRONTEND_DIR)
	docker build -t $(NAME)-backend $(BACKEND_DIR)

run:
	docker run -d -p $(PORT):80 --name $(NAME)-frontend $(NAME)-frontend
	docker run -d -p 3000:3000 --name $(NAME)-backend $(NAME)-backend

up:
	docker run -d -p $(PORT):80 --name $(NAME)-frontend $(NAME)-frontend
	docker run -d -p 3000:3000 --name $(NAME)-backend $(NAME)-backend

stop:
	docker stop $(NAME)-frontend $(NAME)-backend

clean:
	docker rm $(NAME)-frontend $(NAME)-backend

fclean: stop clean
	docker rmi $(NAME)-frontend $(NAME)-backend

re: stop clean build run

ps:
	docker ps

logs:
	docker logs $(NAME)-frontend
	docker logs $(NAME)-backend

.PHONY: build run up stop clean fclean re ps logs