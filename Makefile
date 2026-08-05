.PHONY: dev check install

NODE_IMAGE ?= node:24-alpine
DEV_PORT ?= 3000
DOCKER_RUN = docker run --rm -v "$(CURDIR):/app" -v /app/node_modules -w /app

install:
	$(DOCKER_RUN) $(NODE_IMAGE) npm ci

dev:
	$(DOCKER_RUN) -p 127.0.0.1:$(DEV_PORT):3000 --add-host=host.docker.internal:host-gateway \
		-e VITE_DEV_PROXY_TARGET=http://host.docker.internal:8080 $(NODE_IMAGE) \
		sh -c 'npm ci && npm run dev'

check:
	$(DOCKER_RUN) $(NODE_IMAGE) sh -c 'npm ci && npm run build'
