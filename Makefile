export DOCKER_UID := $(shell id -u)
export DOCKER_GID := $(shell id -g)

RUN := docker compose run --rm app

.PHONY: install data dev build standalone preview lint test shell

install:
	$(RUN) npm install

data:
	$(RUN) npm run data

dev:
	docker compose run --rm --service-ports dev

build:
	$(RUN) npm run build

standalone:
	$(RUN) npm run build:standalone

preview:
	docker compose run --rm --service-ports preview

lint:
	$(RUN) npm run lint

test:
	$(RUN) npm test

shell:
	$(RUN) sh
