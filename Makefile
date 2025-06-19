NAME = transcendence
PORT = 8080
FRONTEND_DIR = ./frontend

build:
	docker build -t $(NAME) $(FRONTEND_DIR)

run:
	docker run -p $(PORT):80 --name $(NAME) $(NAME)

up:
	docker run -d -p $(PORT):80 --name $(NAME) $(NAME)

stop:
	docker stop $(NAME)

clean:
	docker rm $(NAME)

fclean: stop clean
	docker rmi $(NAME)

re: stop clean build run

ps:
	docker ps

logs:
	docker logs $(NAME)

.PHONY: build run up stop clean fclean re ps logs